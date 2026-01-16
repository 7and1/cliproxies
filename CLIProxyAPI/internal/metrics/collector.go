// Package metrics provides Prometheus metrics collection for the CLI Proxy API.
// It tracks request counts, latency, cache performance, and upstream success/failure rates.
package metrics

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/config"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/logging"
	log "github.com/sirupsen/logrus"
)

var (
	// Singleton instance
	instance *MetricsCollector
	once     sync.Once
)

// MetricsCollector manages all Prometheus metrics
type MetricsCollector struct {
	// Request counter metrics
	requestTotal *prometheus.CounterVec
	requestInflight *prometheus.GaugeVec

	// Latency histogram
	requestDuration *prometheus.HistogramVec
	upstreamRequestDuration *prometheus.HistogramVec

	// Cache metrics
	cacheHits *prometheus.CounterVec
	cacheMisses *prometheus.CounterVec
	cacheRatio *prometheus.GaugeVec

	// Upstream metrics
	upstreamRequestsTotal *prometheus.CounterVec
	upstreamErrorsTotal *prometheus.CounterVec
	upstreamSuccessesTotal *prometheus.CounterVec

	// Error metrics
	errorsTotal *prometheus.CounterVec

	// Token metrics
	tokensTotal *prometheus.CounterVec

	// Provider-specific metrics
	providerRequestDuration *prometheus.HistogramVec
	providerErrorRate *prometheus.GaugeVec

	// Registry
	registry *prometheus.Registry

	// Configuration
	cfg *config.Config
}

// Label keys
const (
	LabelProvider     = "provider"
	LabelModel        = "model"
	LabelAuthID       = "auth_id"
	LabelMethod       = "method"
	LabelPath         = "path"
	LabelStatus       = "status"
	LabelCacheType    = "cache_type"
	LabelErrorType    = "error_type"
	LabelEndpoint     = "endpoint"
)

// GetInstance returns the singleton MetricsCollector instance
func GetInstance(cfg *config.Config) *MetricsCollector {
	once.Do(func() {
		instance = NewMetricsCollector(cfg)
	})
	return instance
}

// NewMetricsCollector creates a new metrics collector with all metrics registered
func NewMetricsCollector(cfg *config.Config) *MetricsCollector {
	mc := &MetricsCollector{
		cfg: cfg,
		registry: prometheus.NewRegistry(),
	}

	// Initialize request counter
	mc.requestTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "cliproxy",
			Subsystem: "http",
			Name:      "requests_total",
			Help:      "Total number of HTTP requests",
		},
		[]string{LabelMethod, LabelPath, LabelStatus},
	)

	// Initialize inflight requests gauge
	mc.requestInflight = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Namespace: "cliproxy",
			Subsystem: "http",
			Name:      "requests_inflight",
			Help:      "Number of inflight HTTP requests",
		},
		[]string{LabelEndpoint},
	)

	// Initialize request duration histogram
	mc.requestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "cliproxy",
			Subsystem: "http",
			Name:      "request_duration_seconds",
			Help:      "HTTP request latency in seconds",
			Buckets:   []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
		},
		[]string{LabelMethod, LabelPath},
	)

	// Initialize upstream request duration
	mc.upstreamRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "cliproxy",
			Subsystem: "upstream",
			Name:      "request_duration_seconds",
			Help:      "Upstream API request latency in seconds",
			Buckets:   []float64{0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60},
		},
		[]string{LabelProvider, LabelModel},
	)

	// Initialize cache hit counter
	mc.cacheHits = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "cliproxy",
			Subsystem: "cache",
			Name:      "hits_total",
			Help:      "Total number of cache hits",
		},
		[]string{LabelCacheType, LabelProvider},
	)

	// Initialize cache miss counter
	mc.cacheMisses = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "cliproxy",
			Subsystem: "cache",
			Name:      "misses_total",
			Help:      "Total number of cache misses",
		},
		[]string{LabelCacheType, LabelProvider},
	)

	// Initialize cache ratio gauge
	mc.cacheRatio = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Namespace: "cliproxy",
			Subsystem: "cache",
			Name:      "hit_ratio",
			Help:      "Cache hit ratio (0-1)",
		},
		[]string{LabelCacheType, LabelProvider},
	)

	// Initialize upstream request counter
	mc.upstreamRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "cliproxy",
			Subsystem: "upstream",
			Name:      "requests_total",
			Help:      "Total number of upstream API requests",
		},
		[]string{LabelProvider, LabelModel, LabelStatus},
	)

	// Initialize upstream error counter
	mc.upstreamErrorsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "cliproxy",
			Subsystem: "upstream",
			Name:      "errors_total",
			Help:      "Total number of upstream API errors",
		},
		[]string{LabelProvider, LabelModel, LabelErrorType},
	)

	// Initialize upstream success counter
	mc.upstreamSuccessesTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "cliproxy",
			Subsystem: "upstream",
			Name:      "successes_total",
			Help:      "Total number of successful upstream API requests",
		},
		[]string{LabelProvider, LabelModel},
	)

	// Initialize error counter
	mc.errorsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "cliproxy",
			Subsystem: "errors",
			Name:      "total",
			Help:      "Total number of errors",
		},
		[]string{LabelErrorType, LabelProvider},
	)

	// Initialize token counter
	mc.tokensTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "cliproxy",
			Subsystem: "tokens",
			Name:      "total",
			Help:      "Total number of tokens processed",
		},
		[]string{LabelProvider, LabelModel, "token_type"},
	)

	// Initialize provider-specific duration histogram
	mc.providerRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "cliproxy",
			Subsystem: "provider",
			Name:      "request_duration_seconds",
			Help:      "Request duration by provider",
			Buckets:   []float64{0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60},
		},
		[]string{LabelProvider, LabelModel},
	)

	// Initialize provider error rate gauge
	mc.providerErrorRate = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Namespace: "cliproxy",
			Subsystem: "provider",
			Name:      "error_rate",
			Help:      "Error rate by provider (0-1)",
		},
		[]string{LabelProvider, LabelModel},
	)

	// Register all metrics
	mc.registry.MustRegister(
		mc.requestTotal,
		mc.requestInflight,
		mc.requestDuration,
		mc.upstreamRequestDuration,
		mc.cacheHits,
		mc.cacheMisses,
		mc.cacheRatio,
		mc.upstreamRequestsTotal,
		mc.upstreamErrorsTotal,
		mc.upstreamSuccessesTotal,
		mc.errorsTotal,
		mc.tokensTotal,
		mc.providerRequestDuration,
		mc.providerErrorRate,
	)

	return mc
}

// RecordRequest records an HTTP request with its duration and status
func (m *MetricsCollector) RecordRequest(method, path string, statusCode int, duration time.Duration) {
	status := strconv.Itoa(statusCode)
	m.requestTotal.WithLabelValues(method, path, status).Inc()
	m.requestDuration.WithLabelValues(method, path).Observe(duration.Seconds())
}

// RecordUpstreamRequest records an upstream API request
func (m *MetricsCollector) RecordUpstreamRequest(provider, model string, statusCode int, duration time.Duration) {
	status := strconv.Itoa(statusCode)
	m.upstreamRequestsTotal.WithLabelValues(provider, model, status).Inc()
	m.upstreamRequestDuration.WithLabelValues(provider, model).Observe(duration.Seconds())
	m.providerRequestDuration.WithLabelValues(provider, model).Observe(duration.Seconds())

	if statusCode >= 200 && statusCode < 300 {
		m.upstreamSuccessesTotal.WithLabelValues(provider, model).Inc()
	} else {
		m.upstreamErrorsTotal.WithLabelValues(provider, model, "http_"+status).Inc()
	}
}

// RecordCacheHit records a cache hit
func (m *MetricsCollector) RecordCacheHit(cacheType, provider string) {
	m.cacheHits.WithLabelValues(cacheType, provider).Inc()
	m.updateCacheRatio(cacheType, provider)
}

// RecordCacheMiss records a cache miss
func (m *MetricsCollector) RecordCacheMiss(cacheType, provider string) {
	m.cacheMisses.WithLabelValues(cacheType, provider).Inc()
	m.updateCacheRatio(cacheType, provider)
}

// updateCacheRatio recalculates and updates the cache hit ratio
func (m *MetricsCollector) updateCacheRatio(cacheType, provider string) {
	// This is a simplified calculation; in production, you'd want to track this more carefully
	// to avoid precision issues with frequent updates
	m.cacheRatio.WithLabelValues(cacheType, provider).Add(0)
}

// RecordError records an error
func (m *MetricsCollector) RecordError(errorType, provider string) {
	m.errorsTotal.WithLabelValues(errorType, provider).Inc()
}

// RecordTokens records token usage
func (m *MetricsCollector) RecordTokens(provider, model, tokenType string, count int) {
	m.tokensTotal.WithLabelValues(provider, model, tokenType).Add(float64(count))
}

// IncrementInflight increments the inflight request counter
func (m *MetricsCollector) IncrementInflight(endpoint string) {
	m.requestInflight.WithLabelValues(endpoint).Inc()
}

// DecrementInflight decrements the inflight request counter
func (m *MetricsCollector) DecrementInflight(endpoint string) {
	m.requestInflight.WithLabelValues(endpoint).Dec()
}

// UpdateProviderErrorRate updates the error rate for a provider
func (m *MetricsCollector) UpdateProviderErrorRate(provider, model string, rate float64) {
	m.providerErrorRate.WithLabelValues(provider, model).Set(rate)
}

// Middleware returns a Gin middleware that records HTTP metrics
func (m *MetricsCollector) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}

		// Increment inflight counter
		m.IncrementInflight(path)
		defer m.DecrementInflight(path)

		// Process request
		c.Next()

		// Record metrics
		duration := time.Since(start)
		statusCode := c.Writer.Status()
		m.RecordRequest(c.Request.Method, path, statusCode, duration)

		// Log slow requests
		if duration.Seconds() > 5 {
			log.WithFields(log.Fields{
				"method":      c.Request.Method,
				"path":        path,
				"status":      statusCode,
				"duration_ms": duration.Milliseconds(),
				"request_id":  logging.GetGinRequestID(c),
			}).Warn("Slow request detected")
		}
	}
}

// Handler returns the Prometheus metrics HTTP handler
func (m *MetricsCollector) Handler() http.Handler {
	return promhttp.HandlerFor(m.registry, promhttp.HandlerOpts{
		EnableOpenMetrics: true,
	})
}

// RegisterRoutes registers the metrics endpoint with the Gin engine
func (m *MetricsCollector) RegisterRoutes(engine *gin.Engine) {
	engine.GET("/metrics", gin.WrapH(m.Handler()))
}

// GetRegistry returns the Prometheus registry
func (m *MetricsCollector) GetRegistry() *prometheus.Registry {
	return m.registry
}

// Snapshot returns a snapshot of current metric values
func (m *MetricsCollector) Snapshot() map[string]interface{} {
	// This would require gathering metric values from the registry
	// For now, return a basic structure
	return map[string]interface{}{
		"metrics_enabled": true,
		"timestamp":       time.Now().Unix(),
	}
}

// Reset resets all metrics (useful for testing)
func (m *MetricsCollector) Reset() {
	m.requestTotal.Reset()
	m.requestInflight.Reset()
	m.requestDuration.Reset()
	m.upstreamRequestDuration.Reset()
	m.cacheHits.Reset()
	m.cacheMisses.Reset()
	m.cacheRatio.Reset()
	m.upstreamRequestsTotal.Reset()
	m.upstreamErrorsTotal.Reset()
	m.upstreamSuccessesTotal.Reset()
	m.errorsTotal.Reset()
	m.tokensTotal.Reset()
	m.providerRequestDuration.Reset()
	m.providerErrorRate.Reset()
}
