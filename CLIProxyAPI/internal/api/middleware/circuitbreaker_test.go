// Package middleware tests for circuit breaker functionality
package middleware

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

// CircuitBreakerState represents the current state of the circuit breaker
type CircuitBreakerState int

const (
	StateClosed CircuitBreakerState = iota
	StateHalfOpen
	StateOpen
)

// CircuitBreakerConfig holds configuration for the circuit breaker
type CircuitBreakerConfig struct {
	MaxFailures     int           // Maximum failures before opening
	ResetTimeout    time.Duration // Time to wait before trying half-open
	SuccessThreshold int          // Successes needed to close circuit in half-open
}

// DefaultCircuitBreakerConfig returns sensible defaults
func DefaultCircuitBreakerConfig() CircuitBreakerConfig {
	return CircuitBreakerConfig{
		MaxFailures:     5,
		ResetTimeout:    30 * time.Second,
		SuccessThreshold: 2,
	}
}

// CircuitBreaker implements the circuit breaker pattern
type CircuitBreaker struct {
	config         CircuitBreakerConfig
	state          CircuitBreakerState
	failures       int32
	successes      int32
	lastFailureTime time.Time
	mu             chan struct{}
}

// NewCircuitBreaker creates a new circuit breaker
func NewCircuitBreaker(config CircuitBreakerConfig) *CircuitBreaker {
	if config.MaxFailures <= 0 {
		config.MaxFailures = 5
	}
	if config.ResetTimeout <= 0 {
		config.ResetTimeout = 30 * time.Second
	}
	if config.SuccessThreshold <= 0 {
		config.SuccessThreshold = 2
	}

	return &CircuitBreaker{
		config: config,
		state:  StateClosed,
		mu:     make(chan struct{}, 1),
	}
}

// AllowRequest checks if a request should be allowed through the circuit breaker
func (cb *CircuitBreaker) AllowRequest() bool {
	if cb.state == StateClosed {
		return true
	}

	if cb.state == StateOpen {
		// Check if we should transition to half-open
		if time.Since(cb.lastFailureTime) >= cb.config.ResetTimeout {
			cb.setState(StateHalfOpen)
			return true
		}
		return false
	}

	// Half-open state
	return true
}

// RecordSuccess records a successful call
func (cb *CircuitBreaker) RecordSuccess() {
	if cb.state == StateHalfOpen {
		successes := atomic.AddInt32(&cb.successes, 1)
		if int(successes) >= cb.config.SuccessThreshold {
			cb.reset()
		}
	} else if cb.state == StateClosed {
		atomic.StoreInt32(&cb.failures, 0)
	}
}

// RecordFailure records a failed call
func (cb *CircuitBreaker) RecordFailure() {
	atomic.AddInt32(&cb.failures, 1)
	cb.lastFailureTime = time.Now()

	failures := atomic.LoadInt32(&cb.failures)
	if int(failures) >= cb.config.MaxFailures {
		cb.setState(StateOpen)
	}
}

// GetState returns the current state
func (cb *CircuitBreaker) GetState() CircuitBreakerState {
	return cb.state
}

// setState updates the state in a thread-safe manner
func (cb *CircuitBreaker) setState(state CircuitBreakerState) {
	select {
	case cb.mu <- struct{}{}:
		cb.state = state
		if state == StateClosed {
			cb.reset()
		} else if state == StateHalfOpen {
			atomic.StoreInt32(&cb.successes, 0)
		}
		<-cb.mu
	default:
	}
}

// reset resets the circuit breaker to closed state
func (cb *CircuitBreaker) reset() {
	atomic.StoreInt32(&cb.failures, 0)
	atomic.StoreInt32(&cb.successes, 0)
	cb.state = StateClosed
}

// Execute runs the given function, applying circuit breaker logic
func (cb *CircuitBreaker) Execute(fn func() error) error {
	if !cb.AllowRequest() {
		return errors.New("circuit breaker is open")
	}

	err := fn()
	if err != nil {
		cb.RecordFailure()
		return err
	}

	cb.RecordSuccess()
	return nil
}

// Test helper for circuit breaker tests

type mockService struct {
	shouldFail bool
	callCount  int32
}

func (m *mockService) call() error {
	atomic.AddInt32(&m.callCount, 1)
	if m.shouldFail {
		return errors.New("service error")
	}
	return nil
}

// Table-driven tests for circuit breaker

func TestCircuitBreaker_InitialState(t *testing.T) {
	tests := []struct {
		name     string
		config   CircuitBreakerConfig
		wantState CircuitBreakerState
	}{
		{
			name:     "default config starts closed",
			config:   DefaultCircuitBreakerConfig(),
			wantState: StateClosed,
		},
		{
			name:     "custom config starts closed",
			config:   CircuitBreakerConfig{MaxFailures: 3, ResetTimeout: 10 * time.Second},
			wantState: StateClosed,
		},
		{
			name:     "zero values are normalized",
			config:   CircuitBreakerConfig{},
			wantState: StateClosed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cb := NewCircuitBreaker(tt.config)
			if cb.state != tt.wantState {
				t.Errorf("NewCircuitBreaker() state = %v, want %v", cb.state, tt.wantState)
			}
		})
	}
}

func TestCircuitBreaker_AllowRequest_ClosedState(t *testing.T) {
	cb := NewCircuitBreaker(DefaultCircuitBreakerConfig())

	if !cb.AllowRequest() {
		t.Error("AllowRequest() in closed state should return true")
	}
}

func TestCircuitBreaker_TransitionsToOpenAfterFailures(t *testing.T) {
	config := DefaultCircuitBreakerConfig()
	config.MaxFailures = 3
	cb := NewCircuitBreaker(config)

	// Record failures up to max
	for i := 0; i < config.MaxFailures; i++ {
		cb.RecordFailure()
	}

	if cb.state != StateOpen {
		t.Errorf("After %d failures, state should be Open, got %v", config.MaxFailures, cb.state)
	}

	if cb.AllowRequest() {
		t.Error("AllowRequest() should return false when circuit is open")
	}
}

func TestCircuitBreaker_TransitionsToHalfOpenAfterTimeout(t *testing.T) {
	config := DefaultCircuitBreakerConfig()
	config.MaxFailures = 2
	config.ResetTimeout = 50 * time.Millisecond
	cb := NewCircuitBreaker(config)

	// Open the circuit
	for i := 0; i < config.MaxFailures; i++ {
		cb.RecordFailure()
	}

	if cb.state != StateOpen {
		t.Fatal("Circuit should be open after failures")
	}

	// Wait for reset timeout
	time.Sleep(config.ResetTimeout + 10*time.Millisecond)

	// Next AllowRequest should transition to half-open
	if !cb.AllowRequest() {
		t.Error("AllowRequest() should return true after reset timeout")
	}

	if cb.state != StateHalfOpen {
		t.Errorf("State should be HalfOpen after timeout, got %v", cb.state)
	}
}

func TestCircuitBreaker_ClosesAfterSuccessThreshold(t *testing.T) {
	config := DefaultCircuitBreakerConfig()
	config.MaxFailures = 2
	config.ResetTimeout = 10 * time.Millisecond
	config.SuccessThreshold = 2
	cb := NewCircuitBreaker(config)

	// Open the circuit
	cb.RecordFailure()
	cb.RecordFailure()

	// Wait for timeout and transition to half-open
	time.Sleep(config.ResetTimeout + 10*time.Millisecond)
	cb.AllowRequest()

	// Record successes
	cb.RecordSuccess()
	if cb.state != StateHalfOpen {
		t.Errorf("State should still be HalfOpen after 1 success, got %v", cb.state)
	}

	cb.RecordSuccess()
	if cb.state != StateClosed {
		t.Errorf("State should be Closed after reaching success threshold, got %v", cb.state)
	}

	// Should allow requests again
	if !cb.AllowRequest() {
		t.Error("AllowRequest() should return true when circuit is closed")
	}
}

func TestCircuitBreaker_Execute_Success(t *testing.T) {
	cb := NewCircuitBreaker(DefaultCircuitBreakerConfig())
	service := &mockService{shouldFail: false}

	err := cb.Execute(service.call)

	if err != nil {
		t.Errorf("Execute() returned error: %v", err)
	}

	if atomic.LoadInt32(&service.callCount) != 1 {
		t.Errorf("Service should be called once, was called %d times", service.callCount)
	}
}

func TestCircuitBreaker_Execute_Failure(t *testing.T) {
	config := DefaultCircuitBreakerConfig()
	config.MaxFailures = 3
	cb := NewCircuitBreaker(config)
	service := &mockService{shouldFail: true}

	// Execute failing calls
	for i := 0; i < config.MaxFailures; i++ {
		err := cb.Execute(service.call)
		if err == nil {
			t.Error("Execute() should return error when service fails")
		}
	}

	// Circuit should be open now
	if cb.state != StateOpen {
		t.Errorf("State should be Open after failures, got %v", cb.state)
	}

	// Next call should be rejected without executing service
	initialCalls := atomic.LoadInt32(&service.callCount)
	err := cb.Execute(service.call)
	if err == nil || err.Error() != "circuit breaker is open" {
		t.Errorf("Execute() should return 'circuit breaker is open' error, got: %v", err)
	}

	finalCalls := atomic.LoadInt32(&service.callCount)
	if finalCalls != initialCalls {
		t.Error("Service should not be called when circuit is open")
	}
}

func TestCircuitBreaker_ResetOnSuccessInClosedState(t *testing.T) {
	config := DefaultCircuitBreakerConfig()
	config.MaxFailures = 5
	cb := NewCircuitBreaker(config)

	// Record some failures
	cb.RecordFailure()
	cb.RecordFailure()

	failures := atomic.LoadInt32(&cb.failures)
	if failures != 2 {
		t.Errorf("Should have 2 failures, got %d", failures)
	}

	// Record success
	cb.RecordSuccess()

	failures = atomic.LoadInt32(&cb.failures)
	if failures != 0 {
		t.Errorf("Failures should be reset to 0 after success, got %d", failures)
	}
}

func TestCircuitBreaker_Middleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	config := DefaultCircuitBreakerConfig()
	config.MaxFailures = 3
	cb := NewCircuitBreaker(config)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		// Apply circuit breaker to request context
		c.Set("circuitBreaker", cb)
		c.Next()
	})
	router.GET("/test", func(c *gin.Context) {
		breaker := c.MustGet("circuitBreaker").(*CircuitBreaker)
		if !breaker.AllowRequest() {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "circuit breaker open"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Make successful requests
	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Request %d should succeed, got status %d", i+1, w.Code)
		}
	}

	// Record failures to open circuit
	for i := 0; i < config.MaxFailures; i++ {
		cb.RecordFailure()
	}

	// Next request should be rejected
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("Expected status 503, got %d", w.Code)
	}
}

func TestCircuitBreaker_ConcurrentAccess(t *testing.T) {
	config := DefaultCircuitBreakerConfig()
	config.MaxFailures = 100
	config.SuccessThreshold = 10
	cb := NewCircuitBreaker(config)

	// Concurrent reads
	done := make(chan bool)
	for i := 0; i < 100; i++ {
		go func() {
			for j := 0; j < 100; j++ {
				cb.AllowRequest()
			}
			done <- true
		}()
	}

	// Concurrent state changes
	for i := 0; i < 10; i++ {
		go func() {
			for j := 0; j < 50; j++ {
				cb.RecordSuccess()
				cb.RecordFailure()
			}
			done <- true
		}()
	}

	// Wait for all goroutines
	for i := 0; i < 110; i++ {
		<-done
	}

	// Should not panic or deadlock
	state := cb.GetState()
	if state < StateClosed || state > StateOpen {
		t.Errorf("Invalid state: %v", state)
	}
}

func TestCircuitBreaker_ExecuteWithContext(t *testing.T) {
	cb := NewCircuitBreaker(DefaultCircuitBreakerConfig())
	ctx := context.Background()

	// Test with context-aware function
	err := cb.Execute(func() error {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			return nil
		}
	})

	if err != nil {
		t.Errorf("Execute() returned error: %v", err)
	}
}

func TestCircuitBreaker_GetStats(t *testing.T) {
	config := DefaultCircuitBreakerConfig()
	cb := NewCircuitBreaker(config)

	cb.RecordFailure()
	cb.RecordFailure()
	cb.RecordSuccess()

	stats := map[string]interface{}{
		"state":    cb.GetState().String(),
		"failures": atomic.LoadInt32(&cb.failures),
		"successes": atomic.LoadInt32(&cb.successes),
	}

	if stats["state"] != "closed" {
		t.Errorf("Expected state 'closed', got %v", stats["state"])
	}
}

// String method for CircuitBreakerState
func (s CircuitBreakerState) String() string {
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
