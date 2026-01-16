// Package circuitbreaker implements circuit breaker pattern for upstream API calls.
// It prevents cascading failures by automatically disabling unhealthy upstreams.
package circuitbreaker

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
)

var (
	// ErrBreakerOpen is returned when the circuit breaker is open
	ErrBreakerOpen = errors.New("circuit breaker is open")
	// ErrTooManyRequests is returned when request limit is exceeded
	ErrTooManyRequests = errors.New("too many requests")
)

// State represents the circuit breaker state
type State int

const (
	// StateClosed means the circuit breaker is operational
	StateClosed State = iota
	// StateHalfOpen means the circuit breaker is attempting recovery
	StateHalfOpen
	// StateOpen means the circuit breaker is tripped and blocking requests
	StateOpen
)

// String returns the string representation of the state
func (s State) String() string {
	switch s {
	case StateClosed:
		return "closed"
	case StateHalfOpen:
		return "half-open"
	case StateOpen:
		return "open"
	default:
		return "unknown"
	}
}

// Config holds configuration for the circuit breaker
type Config struct {
	// MaxRequests is the maximum number of requests allowed in half-open state
	MaxRequests uint32
	// Interval is the cyclic period of the closed state
	Interval time.Duration
	// Timeout is the duration to wait after opening before trying to recover
	Timeout time.Duration
	// ReadyToTrip is called when a request fails and determines if the breaker should trip
	ReadyToTrip func(counts Counts) bool
	// OnStateChange is called whenever the state changes
	OnStateChange func(name string, from State, to State)
	// IsSuccessful is called for each request to determine if it was successful
	IsSuccessful func(err error) bool
	// FailureThreshold is the number of consecutive failures before tripping
	FailureThreshold int
	// SuccessThreshold is the number of consecutive successes to close the breaker
	SuccessThreshold int
	// MonitoringPeriod is how long to remember failure counts
	MonitoringPeriod time.Duration
}

// DefaultConfig returns sensible defaults for circuit breaker configuration
func DefaultConfig() Config {
	return Config{
		MaxRequests:       1,
		Interval:          0, // Disabled
		Timeout:           60 * time.Second,
		ReadyToTrip:       defaultReadyToTrip,
		OnStateChange:     defaultOnStateChange,
		IsSuccessful:      defaultIsSuccessful,
		FailureThreshold:  5,
		SuccessThreshold:  2,
		MonitoringPeriod:  60 * time.Second,
	}
}

// defaultReadyToTrip trips the breaker when there are more failures than successes
func defaultReadyToTrip(counts Counts) bool {
	return counts.ConsecutiveFailures > 5
}

// defaultOnStateChange logs state changes
func defaultOnStateChange(name string, from State, to State) {
	log.WithFields(log.Fields{
		"breaker": name,
		"from":    from.String(),
		"to":      to.String(),
	}).Info("Circuit breaker state changed")
}

// defaultIsSuccessful considers nil errors as success
func defaultIsSuccessful(err error) bool {
	return err == nil
}

// Counts holds internal metrics for the circuit breaker
type Counts struct {
	Requests             uint32
	TotalSuccesses       uint32
	TotalFailures        uint32
	ConsecutiveSuccesses uint32
	ConsecutiveFailures  uint32
}

// CircuitBreaker implements the circuit breaker pattern
type CircuitBreaker struct {
	name          string
	cfg           Config
	state         State
	generation    uint64
	counts        Counts
	expiry        time.Time
	mu            sync.Mutex
	lastFailure   time.Time
	lastSuccess   time.Time
	requestCount  uint32
	requests      map[string]*RequestMetrics
}

// RequestMetrics tracks metrics for specific upstream endpoints
type RequestMetrics struct {
	TotalRequests     uint64
	FailedRequests    uint64
	SuccessRequests   uint64
	LastError         error
	LastErrorTime     time.Time
	LastSuccessTime   time.Time
	AverageLatency    time.Duration
	TotalLatency      time.Duration
	FailureRate       float64
	mu                sync.RWMutex
}

// NewCircuitBreaker creates a new circuit breaker with the given configuration
func NewCircuitBreaker(name string, cfg Config) *CircuitBreaker {
	if cfg.ReadyToTrip == nil {
		cfg.ReadyToTrip = defaultReadyToTrip
	}
	if cfg.OnStateChange == nil {
		cfg.OnStateChange = defaultOnStateChange
	}
	if cfg.IsSuccessful == nil {
		cfg.IsSuccessful = defaultIsSuccessful
	}
	if cfg.FailureThreshold <= 0 {
		cfg.FailureThreshold = 5
	}
	if cfg.SuccessThreshold <= 0 {
		cfg.SuccessThreshold = 2
	}
	if cfg.MonitoringPeriod <= 0 {
		cfg.MonitoringPeriod = 60 * time.Second
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = 60 * time.Second
	}

	return &CircuitBreaker{
		name:     name,
		cfg:      cfg,
		state:    StateClosed,
		requests: make(map[string]*RequestMetrics),
	}
}

// Name returns the name of the circuit breaker
func (cb *CircuitBreaker) Name() string {
	return cb.name
}

// State returns the current state of the circuit breaker
func (cb *CircuitBreaker) State() State {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	return cb.state
}

// Execute runs the given function if the circuit breaker allows it
func (cb *CircuitBreaker) Execute(ctx context.Context, req func() error) error {
	generation, err := cb.allow()
	if err != nil {
		return err
	}

	// Execute the request
	defer cb.onDone(generation, &err)
	return req()
}

// ExecuteWithResult runs the given function and returns its result
func (cb *CircuitBreaker) ExecuteWithResult(ctx context.Context, req func() (interface{}, error)) (interface{}, error) {
	generation, err := cb.allow()
	if err != nil {
		return nil, err
	}

	// Execute the request
	result, err := req()
	cb.onDone(generation, &err)
	return result, err
}

// allow checks if the request should be allowed
func (cb *CircuitBreaker) allow() (uint64, error) {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	now := time.Now()
	state, expiry := cb.currentState(now)

	if state == StateOpen && now.Before(expiry) {
		cb.counts.Requests++
		return 0, ErrBreakerOpen
	}

	if state == StateOpen {
		cb.setState(now, StateHalfOpen)
	}

	if cb.cfg.MaxRequests > 0 && cb.counts.Requests >= cb.cfg.MaxRequests {
		return 0, ErrTooManyRequests
	}

	cb.counts.Requests++
	return cb.generation, nil
}

// onDone updates the circuit breaker state after request completion
func (cb *CircuitBreaker) onDone(before uint64, err *error) {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	now := time.Now()
	state, _ := cb.currentState(now)

	if before != cb.generation {
		return
	}

	if cb.cfg.IsSuccessful(*err) {
		cb.onSuccess(state, now)
	} else {
		cb.onFailure(state, now, *err)
	}
}

// onSuccess handles successful requests
func (cb *CircuitBreaker) onSuccess(state State, now time.Time) {
	cb.counts.TotalSuccesses++
	cb.counts.ConsecutiveSuccesses++
	cb.counts.ConsecutiveFailures = 0
	cb.lastSuccess = now

	if state == StateHalfOpen && int(cb.counts.ConsecutiveSuccesses) >= cb.cfg.SuccessThreshold {
		cb.setState(now, StateClosed)
	}
}

// onFailure handles failed requests
func (cb *CircuitBreaker) onFailure(state State, now time.Time, err error) {
	cb.counts.TotalFailures++
	cb.counts.ConsecutiveFailures++
	cb.counts.ConsecutiveSuccesses = 0
	cb.lastFailure = now

	if cb.cfg.ReadyToTrip(cb.counts) {
		cb.setState(now, StateOpen)
	}
}

// currentState returns the current state and expiry time
func (cb *CircuitBreaker) currentState(now time.Time) (State, time.Time) {
	switch cb.state {
	case StateClosed:
		if cb.expiry.IsZero() {
			return StateClosed, time.Time{}
		}
		if now.Before(cb.expiry) {
			return StateClosed, cb.expiry
		}
	case StateOpen:
		if now.Before(cb.expiry) {
			return StateOpen, cb.expiry
		}
	}
	return cb.state, cb.expiry
}

// setState changes the state of the circuit breaker
func (cb *CircuitBreaker) setState(now time.Time, newState State) {
	if cb.state == newState {
		return
	}

	oldState := cb.state
	cb.state = newState
	cb.generation++

	now = now.UTC()

	switch newState {
	case StateClosed:
		if cb.cfg.Interval == 0 {
			cb.expiry = time.Time{}
		} else {
			cb.expiry = now.Add(cb.cfg.Interval)
		}
	case StateOpen:
		cb.expiry = now.Add(cb.cfg.Timeout)
	case StateHalfOpen:
		cb.expiry = time.Time{}
	}

	cb.counts.Requests = 0
	cb.counts.ConsecutiveSuccesses = 0
	cb.counts.ConsecutiveFailures = 0

	if cb.cfg.OnStateChange != nil {
		cb.cfg.OnStateChange(cb.name, oldState, newState)
	}
}

// GetMetrics returns current metrics for the circuit breaker
func (cb *CircuitBreaker) GetMetrics() map[string]interface{} {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	return map[string]interface{}{
		"name":                  cb.name,
		"state":                 cb.state.String(),
		"requests":              cb.counts.Requests,
		"total_successes":       cb.counts.TotalSuccesses,
		"total_failures":        cb.counts.TotalFailures,
		"consecutive_successes": cb.counts.ConsecutiveSuccesses,
		"consecutive_failures":  cb.counts.ConsecutiveFailures,
		"last_failure":          cb.lastFailure,
		"last_success":          cb.lastSuccess,
	}
}

// RecordUpstreamRequest records metrics for a specific upstream endpoint
func (cb *CircuitBreaker) RecordUpstreamRequest(upstream string, success bool, latency time.Duration, err error) {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	metrics, exists := cb.requests[upstream]
	if !exists {
		metrics = &RequestMetrics{}
		cb.requests[upstream] = metrics
	}

	metrics.mu.Lock()
	defer metrics.mu.Unlock()

	metrics.TotalRequests++
	metrics.TotalLatency += latency
	metrics.AverageLatency = time.Duration(int64(metrics.TotalLatency) / int64(metrics.TotalRequests))

	if success {
		metrics.SuccessRequests++
		metrics.LastSuccessTime = time.Now()
	} else {
		metrics.FailedRequests++
		metrics.LastError = err
		metrics.LastErrorTime = time.Now()
	}

	metrics.FailureRate = float64(metrics.FailedRequests) / float64(metrics.TotalRequests)
}

// GetUpstreamMetrics returns metrics for a specific upstream
func (cb *CircuitBreaker) GetUpstreamMetrics(upstream string) *RequestMetrics {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	if metrics, exists := cb.requests[upstream]; exists {
		metrics.mu.RLock()
		defer metrics.mu.RUnlock()

		// Return a copy to avoid race conditions
		return &RequestMetrics{
			TotalRequests:     metrics.TotalRequests,
			FailedRequests:    metrics.FailedRequests,
			SuccessRequests:   metrics.SuccessRequests,
			LastError:         metrics.LastError,
			LastErrorTime:     metrics.LastErrorTime,
			LastSuccessTime:   metrics.LastSuccessTime,
			AverageLatency:    metrics.AverageLatency,
			FailureRate:       metrics.FailureRate,
		}
	}

	return nil
}

// Reset resets the circuit breaker to closed state
func (cb *CircuitBreaker) Reset() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.state = StateClosed
	cb.generation++
	cb.counts = Counts{}
	cb.expiry = time.Time{}
	cb.requests = make(map[string]*RequestMetrics)
}

// Manager manages multiple circuit breakers
type Manager struct {
	breakers map[string]*CircuitBreaker
	mu       sync.RWMutex
	cfg      Config
}

// NewManager creates a new circuit breaker manager
func NewManager(defaultCfg Config) *Manager {
	return &Manager{
		breakers: make(map[string]*CircuitBreaker),
		cfg:      defaultCfg,
	}
}

// GetOrCreate returns a circuit breaker for the given name, creating it if necessary
func (m *Manager) GetOrCreate(name string) *CircuitBreaker {
	m.mu.Lock()
	defer m.mu.Unlock()

	if breaker, exists := m.breakers[name]; exists {
		return breaker
	}

	breaker := NewCircuitBreaker(name, m.cfg)
	m.breakers[name] = breaker
	return breaker
}

// Get returns a circuit breaker if it exists
func (m *Manager) Get(name string) (*CircuitBreaker, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	breaker, exists := m.breakers[name]
	return breaker, exists
}

// GetAll returns all circuit breakers
func (m *Manager) GetAll() map[string]*CircuitBreaker {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make(map[string]*CircuitBreaker, len(m.breakers))
	for name, breaker := range m.breakers {
		result[name] = breaker
	}
	return result
}

// Remove removes a circuit breaker
func (m *Manager) Remove(name string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.breakers, name)
}

// ExecuteWithBreaker executes a function with circuit breaker protection
func (m *Manager) ExecuteWithBreaker(ctx context.Context, breakerName string, fn func() error) error {
	breaker := m.GetOrCreate(breakerName)
	return breaker.Execute(ctx, fn)
}

// ExecuteWithBreakerAndResult executes a function with circuit breaker protection and returns result
func (m *Manager) ExecuteWithBreakerAndResult(ctx context.Context, breakerName string, fn func() (interface{}, error)) (interface{}, error) {
	breaker := m.GetOrCreate(breakerName)
	return breaker.ExecuteWithResult(ctx, fn)
}

// GetAllMetrics returns metrics for all circuit breakers
func (m *Manager) GetAllMetrics() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make(map[string]interface{})
	for name, breaker := range m.breakers {
		result[name] = breaker.GetMetrics()
	}
	return result
}

// ConfigureBreaker configures an existing circuit breaker with new settings
func (m *Manager) ConfigureBreaker(name string, cfg Config) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	breaker, exists := m.breakers[name]
	if !exists {
		return fmt.Errorf("circuit breaker %q not found", name)
	}

	breaker.mu.Lock()
	breaker.cfg = cfg
	breaker.mu.Unlock()

	return nil
}

// BreakerForUpstream creates a circuit breaker name for an upstream endpoint
func BreakerForUpstream(provider, model, baseURL string) string {
	if baseURL != "" {
		return fmt.Sprintf("%s:%s:%s", provider, model, baseURL)
	}
	return fmt.Sprintf("%s:%s", provider, model)
}

// RunHealthCheck runs health checks on all circuit breakers and resets those that have recovered
func (m *Manager) RunHealthCheck(ctx context.Context, checkFunc func(breakerName string) error) {
	m.mu.RLock()
	breakers := make(map[string]*CircuitBreaker, len(m.breakers))
	for name, breaker := range m.breakers {
		breakers[name] = breaker
	}
	m.mu.RUnlock()

	for name, breaker := range breakers {
		if breaker.State() != StateOpen {
			continue
		}

		if checkFunc != nil {
			if err := checkFunc(name); err == nil {
				log.WithField("breaker", name).Info("Circuit breaker health check passed, resetting")
				breaker.Reset()
			}
		}
	}
}

// RequestDurationTracker tracks request duration for circuit breakers
type RequestDurationTracker struct {
	startTime time.Time
	breaker   *CircuitBreaker
	upstream  string
	success   *bool
}

// StartTracking creates a new request tracker
func (m *Manager) StartTracking(breakerName, upstream string) *RequestDurationTracker {
	breaker := m.GetOrCreate(breakerName)
	return &RequestDurationTracker{
		startTime: time.Now(),
		breaker:   breaker,
		upstream:  upstream,
	}
}

// Finish marks the request as complete with success/failure status
func (t *RequestDurationTracker) Finish(success bool, err error) {
	duration := time.Since(t.startTime)
	if t.breaker != nil {
		t.breaker.RecordUpstreamRequest(t.upstream, success, duration, err)
	}
}

// GetUpstreamStatus returns the status of an upstream endpoint
func (m *Manager) GetUpstreamStatus(breakerName, upstream string) string {
	breaker, exists := m.Get(breakerName)
	if !exists {
		return "unknown"
	}

	metrics := breaker.GetUpstreamMetrics(upstream)
	if metrics == nil {
		return "not_tested"
	}

	if metrics.FailureRate > 0.5 {
		return "degraded"
	}
	if breaker.State() == StateOpen {
		return "unhealthy"
	}
	return "healthy"
}
