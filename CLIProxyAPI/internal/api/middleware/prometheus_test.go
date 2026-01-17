// Package middleware tests for Prometheus metrics collection
package middleware

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	dto "github.com/prometheus/client_model/go"
)

// MetricType represents the type of Prometheus metric
type MetricType string

const (
	MetricTypeCounter   MetricType = "counter"
	MetricTypeGauge     MetricType = "gauge"
	MetricTypeHistogram MetricType = "histogram"
	MetricTypeSummary   MetricType = "summary"
)

// MetricConfig holds configuration for a single metric
type MetricConfig struct {
	Name        string
	Type        MetricType
	Help        string
	Labels      []string
	Buckets     []float64
	Objectives  map[float64]float64
}

// MetricsConfig holds configuration for the metrics middleware
type MetricsConfig struct {
	Namespace      string
	Subsystem      string
	EnabledMetrics []string
	LabelMappings  map[string]string
}

// DefaultMetricsConfig returns sensible defaults
func DefaultMetricsConfig() MetricsConfig {
	return MetricsConfig{
		Namespace: "cliproxyapi",
		Subsystem: "http",
		EnabledMetrics: []string{
			"requests_total",
			"request_duration_seconds",
			"response_size_bytes",
			"request_size_bytes",
			"requests_in_flight",
		},
		LabelMappings: map[string]string{
			"method":  "method",
			"path":    "path",
			"status":  "status",
			"host":    "host",
		},
	}
}

// PrometheusMiddleware collects HTTP metrics for Prometheus
type PrometheusMiddleware struct {
	config          MetricsConfig
	requestsTotal   *prometheus.CounterVec
	requestDuration *prometheus.HistogramVec
	responseSize    *prometheus.HistogramVec
	requestSize     *prometheus.HistogramVec
	requestsInFlight *prometheus.GaugeVec
	registry        *prometheus.Registry
}

// NewPrometheusMiddleware creates a new Prometheus metrics middleware
func NewPrometheusMiddleware(config MetricsConfig) *PrometheusMiddleware {
	if config.Namespace == "" {
		config.Namespace = "cliproxyapi"
	}
	if config.Subsystem == "" {
		config.Subsystem = "http"
	}

	m := &PrometheusMiddleware{
		config:   config,
		registry: prometheus.NewRegistry(),
	}

	// Initialize metrics
	m.requestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: config.Namespace,
			Subsystem: config.Subsystem,
			Name:      "requests_total",
			Help:      "Total number of HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	m.requestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: config.Namespace,
			Subsystem: config.Subsystem,
			Name:      "request_duration_seconds",
			Help:      "HTTP request latency in seconds",
			Buckets:   prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)

	m.responseSize = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: config.Namespace,
			Subsystem: config.Subsystem,
			Name:      "response_size_bytes",
			Help:      "HTTP response size in bytes",
			Buckets:   []float64{100, 1000, 10000, 100000, 1000000},
		},
		[]string{"method", "path"},
	)

	m.requestSize = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: config.Namespace,
			Subsystem: config.Subsystem,
			Name:      "request_size_bytes",
			Help:      "HTTP request size in bytes",
			Buckets:   []float64{100, 1000, 10000, 100000},
		},
		[]string{"method", "path"},
	)

	m.requestsInFlight = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Namespace: config.Namespace,
			Subsystem: config.Subsystem,
			Name:      "requests_in_flight",
			Help:      "Number of HTTP requests currently in flight",
		},
		[]string{"method"},
	)

	// Register metrics
	m.registry.MustRegister(m.requestsTotal)
	m.registry.MustRegister(m.requestDuration)
	m.registry.MustRegister(m.responseSize)
	m.registry.MustRegister(m.requestSize)
	m.registry.MustRegister(m.requestsInFlight)

	return m
}

// Middleware returns the Gin middleware function
func (m *PrometheusMiddleware) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		method := c.Request.Method
		path := c.FullPath()

		// Use path pattern if available, otherwise use actual path
		if path == "" {
			path = c.Request.URL.Path
		}

		// Normalize path for metrics (replace IDs with placeholders)
		path = normalizePath(path)

		// Increment in-flight gauge
		m.requestsInFlight.WithLabelValues(method).Inc()

		// Track request size
		if c.Request.ContentLength > 0 {
			m.requestSize.WithLabelValues(method, path).Observe(float64(c.Request.ContentLength))
		}

		// Use response writer wrapper to capture status code and size
		w := &responseWriter{ResponseWriter: c.Writer, status: http.StatusOK}
		c.Writer = w

		// Process request
		c.Next()

		// Calculate duration
		duration := time.Since(start).Seconds()

		// Update metrics
		status := c.Writer.Status()
		m.requestsTotal.WithLabelValues(method, path, statusCodeLabel(status)).Inc()
		m.requestDuration.WithLabelValues(method, path).Observe(duration)
		m.responseSize.WithLabelValues(method, path).Observe(float64(w.size))

		// Decrement in-flight gauge
		m.requestsInFlight.WithLabelValues(method).Dec()
	}
}

// Handler returns the Prometheus metrics handler
func (m *PrometheusMiddleware) Handler() http.Handler {
	return promhttp.HandlerFor(m.registry, promhttp.HandlerOpts{})
}

// GetRegistry returns the Prometheus registry
func (m *PrometheusMiddleware) GetRegistry() *prometheus.Registry {
	return m.registry
}

// normalizePath converts dynamic path segments to placeholders
func normalizePath(path string) string {
	// Common path segments to normalize
	segments := strings.Split(path, "/")
	for i, seg := range segments {
		// Check if segment looks like an ID (UUID or numeric)
		if looksLikeID(seg) {
			segments[i] = ":id"
		}
	}
	return strings.Join(segments, "/")
}

// looksLikeID checks if a string looks like a database ID or UUID
func looksLikeID(s string) bool {
	if len(s) == 36 && strings.Count(s, "-") == 4 {
		return true // UUID format
	}
	if len(s) > 0 {
		isNumeric := true
		for _, c := range s {
			if c < '0' || c > '9' {
				isNumeric = false
				break
			}
		}
		if isNumeric {
			return true
		}
	}
	if strings.Count(s, "-") >= 2 && len(s) >= 8 {
		for _, c := range s {
			if !(c == '-' || (c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
				return false
			}
		}
		return true
	}
	return false
}

// statusCodeLabel converts status code to label
func statusCodeLabel(status int) string {
	switch {
	case status >= 200 && status < 300:
		return "2xx"
	case status >= 300 && status < 400:
		return "3xx"
	case status >= 400 && status < 500:
		return "4xx"
	case status >= 500:
		return "5xx"
	default:
		return "other"
	}
}

// responseWriter wraps gin.ResponseWriter to capture status code and size
type responseWriter struct {
	gin.ResponseWriter
	status int
	size   int
}

func (w *responseWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *responseWriter) Write(b []byte) (int, error) {
	n, err := w.ResponseWriter.Write(b)
	w.size += n
	return n, err
}

func (w *responseWriter) WriteString(s string) (int, error) {
	n, err := w.ResponseWriter.WriteString(s)
	w.size += n
	return n, err
}

// Table-driven tests for Prometheus metrics

func TestPrometheusMiddleware_BasicMetricsCollection(t *testing.T) {
	tests := []struct {
		name         string
		method       string
		path         string
		status       int
		responseBody string
	}{
		{
			name:         "GET request success",
			method:       http.MethodGet,
			path:         "/api/test",
			status:       http.StatusOK,
			responseBody: `{"status":"ok"}`,
		},
		{
			name:         "POST request success",
			method:       http.MethodPost,
			path:         "/api/data",
			status:       http.StatusCreated,
			responseBody: `{"id":"123"}`,
		},
		{
			name:         "client error",
			method:       http.MethodGet,
			path:         "/api/notfound",
			status:       http.StatusNotFound,
			responseBody: `{"error":"not found"}`,
		},
		{
			name:         "server error",
			method:       http.MethodGet,
			path:         "/api/error",
			status:       http.StatusInternalServerError,
			responseBody: `{"error":"internal error"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			m := NewPrometheusMiddleware(DefaultMetricsConfig())

			router := gin.New()
			router.Use(m.Middleware())
			router.Any("/api/*path", func(c *gin.Context) {
				c.Status(tt.status)
				c.Writer.Write([]byte(tt.responseBody))
			})

			req := httptest.NewRequest(tt.method, tt.path, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != tt.status {
				t.Errorf("Status = %d, want %d", w.Code, tt.status)
			}

			// Verify metrics were collected
			metrics := m.GetRegistry()

			// Check requests_total counter
			counter, err := metrics.Gather()
			if err != nil {
				t.Fatalf("Failed to gather metrics: %v", err)
			}

			found := false
			for _, mf := range counter {
				if mf.GetName() == "cliproxyapi_http_requests_total" {
					found = true
					if len(mf.GetMetric()) == 0 {
						t.Error("requests_total metric has no data")
					}
					break
				}
			}
			if !found {
				t.Error("requests_total metric not found")
			}
		})
	}
}

func TestPrometheusMiddleware_RequestDuration(t *testing.T) {
	gin.SetMode(gin.TestMode)
	m := NewPrometheusMiddleware(DefaultMetricsConfig())

	router := gin.New()
	router.Use(m.Middleware())

	delay := 50 * time.Millisecond
	router.GET("/slow", func(c *gin.Context) {
		time.Sleep(delay)
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/slow", nil)
	w := httptest.NewRecorder()
	start := time.Now()
	router.ServeHTTP(w, req)
	elapsed := time.Since(start)

	if w.Code != http.StatusOK {
		t.Errorf("Status = %d, want 200", w.Code)
	}

	// Request should have taken at least the delay
	if elapsed < delay {
		t.Errorf("Request took %v, want at least %v", elapsed, delay)
	}

	// Check histogram metric
	metrics := m.GetRegistry()
	metricFamilies, err := metrics.Gather()
	if err != nil {
		t.Fatalf("Failed to gather metrics: %v", err)
	}

	// Find request duration histogram
	for _, mf := range metricFamilies {
		if mf.GetName() == "cliproxyapi_http_request_duration_seconds" {
			if len(mf.GetMetric()) == 0 {
				t.Error("request_duration_seconds metric has no data")
			}
			metric := mf.GetMetric()[0]
			histogram := metric.GetHistogram()
			if histogram.GetSampleCount() != 1 {
				t.Errorf("Expected 1 sample, got %d", histogram.GetSampleCount())
			}
			return
		}
	}
	t.Error("request_duration_seconds metric not found")
}

func TestPrometheusMiddleware_ResponseSize(t *testing.T) {
	gin.SetMode(gin.TestMode)
	m := NewPrometheusMiddleware(DefaultMetricsConfig())

	router := gin.New()
	router.Use(m.Middleware())

	testBody := strings.Repeat("x", 1000)
	router.GET("/data", func(c *gin.Context) {
		c.Writer.Write([]byte(testBody))
	})

	req := httptest.NewRequest(http.MethodGet, "/data", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Check response size metric
	metrics := m.GetRegistry()
	metricFamilies, err := metrics.Gather()
	if err != nil {
		t.Fatalf("Failed to gather metrics: %v", err)
	}

	for _, mf := range metricFamilies {
		if mf.GetName() == "cliproxyapi_http_response_size_bytes" {
			metric := mf.GetMetric()[0]
			histogram := metric.GetHistogram()
			if histogram.GetSampleCount() == 0 {
				t.Error("response_size_bytes metric has no samples")
			}
			sampleSum := histogram.GetSampleSum()
			if sampleSum < float64(len(testBody)) {
				t.Errorf("Response size %v less than expected %v", sampleSum, len(testBody))
			}
			return
		}
	}
	t.Error("response_size_bytes metric not found")
}

func TestPrometheusMiddleware_RequestSize(t *testing.T) {
	gin.SetMode(gin.TestMode)
	m := NewPrometheusMiddleware(DefaultMetricsConfig())

	router := gin.New()
	router.Use(m.Middleware())

	router.POST("/upload", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	testBody := strings.Repeat("y", 500)
	req := httptest.NewRequest(http.MethodPost, "/upload", strings.NewReader(testBody))
	req.Header.Set("Content-Type", "text/plain")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Check request size metric
	metrics := m.GetRegistry()
	metricFamilies, err := metrics.Gather()
	if err != nil {
		t.Fatalf("Failed to gather metrics: %v", err)
	}

	for _, mf := range metricFamilies {
		if mf.GetName() == "cliproxyapi_http_request_size_bytes" {
			metric := mf.GetMetric()[0]
			histogram := metric.GetHistogram()
			if histogram.GetSampleCount() == 0 {
				t.Error("request_size_bytes metric has no samples")
			}
			sampleSum := histogram.GetSampleSum()
			if sampleSum < float64(len(testBody)) {
				t.Errorf("Request size %v less than expected %v", sampleSum, len(testBody))
			}
			return
		}
	}
	t.Error("request_size_bytes metric not found")
}

func TestPrometheusMiddleware_RequestsInFlight(t *testing.T) {
	gin.SetMode(gin.TestMode)
	m := NewPrometheusMiddleware(DefaultMetricsConfig())

	router := gin.New()
	router.Use(m.Middleware())

	blockChan := make(chan struct{})
	router.GET("/blocking", func(c *gin.Context) {
		<-blockChan
		c.Status(http.StatusOK)
	})

	// Start a blocking request
	req1 := httptest.NewRequest(http.MethodGet, "/blocking", nil)
	w1 := httptest.NewRecorder()
	go router.ServeHTTP(w1, req1)

	// Give it time to start
	time.Sleep(10 * time.Millisecond)

	// Check in-flight metric
	metrics := m.GetRegistry()
	metricFamilies, err := metrics.Gather()
	if err != nil {
		t.Fatalf("Failed to gather metrics: %v", err)
	}

	foundInFlight := false
	for _, mf := range metricFamilies {
		if mf.GetName() == "cliproxyapi_http_requests_in_flight" {
			foundInFlight = true
			metric := mf.GetMetric()[0]
			gauge := metric.GetGauge()
			if gauge.GetValue() < 1 {
				t.Error("requests_in_flight should be at least 1")
			}
			break
		}
	}

	if !foundInFlight {
		t.Error("requests_in_flight metric not found")
	}

	// Unblock the request
	close(blockChan)
	time.Sleep(10 * time.Millisecond)
}

func TestPrometheusMiddleware_MultipleRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	m := NewPrometheusMiddleware(DefaultMetricsConfig())

	router := gin.New()
	router.Use(m.Middleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "ok"})
	})

	// Make multiple requests
	numRequests := 10
	for i := 0; i < numRequests; i++ {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Request %d failed with status %d", i, w.Code)
		}
	}

	// Check counter value
	metrics := m.GetRegistry()
	metricFamilies, err := metrics.Gather()
	if err != nil {
		t.Fatalf("Failed to gather metrics: %v", err)
	}

	for _, mf := range metricFamilies {
		if mf.GetName() == "cliproxyapi_http_requests_total" {
			metric := mf.GetMetric()[0]
			counter := metric.GetCounter()
			if counter.GetValue() != float64(numRequests) {
				t.Errorf("Expected %d requests, got %f", numRequests, counter.GetValue())
			}
			return
		}
	}
	t.Error("requests_total metric not found")
}

func TestPrometheusMiddleware_StatusCodeLabels(t *testing.T) {
	gin.SetMode(gin.TestMode)
	m := NewPrometheusMiddleware(DefaultMetricsConfig())

	router := gin.New()
	router.Use(m.Middleware())

	statusCodes := []int{200, 201, 301, 400, 404, 500, 503}
	router.GET("/status/:code", func(c *gin.Context) {
		statusStr := c.Param("code")
		status, _ := strconv.Atoi(statusStr)
		c.Status(status)
	})

	for _, code := range statusCodes {
		req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/status/%d", code), nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != code {
			t.Errorf("Expected status %d, got %d", code, w.Code)
		}
	}

	// Check that all status codes are tracked
	metrics := m.GetRegistry()
	metricFamilies, err := metrics.Gather()
	if err != nil {
		t.Fatalf("Failed to gather metrics: %v", err)
	}

	for _, mf := range metricFamilies {
		if mf.GetName() == "cliproxyapi_http_requests_total" {
			for _, code := range statusCodes {
				label := statusCodeLabel(code)
				found := false
				for _, metric := range mf.GetMetric() {
					for _, labelPair := range metric.GetLabel() {
						if labelPair.GetName() == "status" && labelPair.GetValue() == label {
							found = true
							break
						}
					}
					if found {
						break
					}
				}
				if !found {
					t.Errorf("Status code label %s (from %d) not found in metrics", label, code)
				}
			}
			return
		}
	}
}

func TestPrometheusMiddleware_PathNormalization(t *testing.T) {
	gin.SetMode(gin.TestMode)
	m := NewPrometheusMiddleware(DefaultMetricsConfig())

	router := gin.New()
	router.Use(m.Middleware())
	router.GET("/users/:id", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"user_id": c.Param("id")})
	})

	// Make requests with different IDs
	ids := []string{"123", "abc-def-ghi", "99999"}
	for _, id := range ids {
		req := httptest.NewRequest(http.MethodGet, "/users/"+id, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Request with id %s failed", id)
		}
	}

	// Check that path was normalized
	metrics := m.GetRegistry()
	metricFamilies, err := metrics.Gather()
	if err != nil {
		t.Fatalf("Failed to gather metrics: %v", err)
	}

	// All requests should be under the same normalized path
	for _, mf := range metricFamilies {
		if mf.GetName() == "cliproxyapi_http_request_duration_seconds" {
			if len(mf.GetMetric()) != 1 {
				t.Errorf("Expected 1 normalized path, got %d", len(mf.GetMetric()))
			}
			return
		}
	}
}

func TestPrometheusMiddleware_MetricsEndpoint(t *testing.T) {
	gin.SetMode(gin.TestMode)
	m := NewPrometheusMiddleware(DefaultMetricsConfig())

	router := gin.New()
	router.Use(m.Middleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "ok"})
	})
	router.GET("/metrics", gin.WrapH(m.Handler()))

	// Make a test request
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Get metrics
	req = httptest.NewRequest(http.MethodGet, "/metrics", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Metrics endpoint returned status %d", w.Code)
	}

	// Check response is Prometheus format
	body := w.Body.String()
	if !strings.Contains(body, "cliproxyapi_http_requests_total") {
		t.Error("Metrics output should contain requests_total")
	}
	if !strings.Contains(body, "cliproxyapi_http_request_duration_seconds") {
		t.Error("Metrics output should contain request_duration_seconds")
	}
}

func TestPrometheusMiddleware_ConcurrentRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)
	m := NewPrometheusMiddleware(DefaultMetricsConfig())

	router := gin.New()
	router.Use(m.Middleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "ok"})
	})

	numGoroutines := 50
	requestsPerGoroutine := 20

	done := make(chan bool, numGoroutines)
	var successCount int32
	var errorCount int32

	for i := 0; i < numGoroutines; i++ {
		go func() {
			defer func() { done <- true }()
			for j := 0; j < requestsPerGoroutine; j++ {
				req := httptest.NewRequest(http.MethodGet, "/test", nil)
				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				if w.Code == http.StatusOK {
					atomic.AddInt32(&successCount, 1)
				} else {
					atomic.AddInt32(&errorCount, 1)
				}
			}
		}()
	}

	// Wait for all goroutines
	for i := 0; i < numGoroutines; i++ {
		<-done
	}

	expected := int32(numGoroutines * requestsPerGoroutine)
	if atomic.LoadInt32(&successCount) != expected {
		t.Errorf("Expected %d successful requests, got %d", expected, atomic.LoadInt32(&successCount))
	}

	if atomic.LoadInt32(&errorCount) > 0 {
		t.Errorf("Had %d failed requests", atomic.LoadInt32(&errorCount))
	}

	// Verify metrics are consistent
	metrics := m.GetRegistry()
	metricFamilies, err := metrics.Gather()
	if err != nil {
		t.Fatalf("Failed to gather metrics: %v", err)
	}

	for _, mf := range metricFamilies {
		if mf.GetName() == "cliproxyapi_http_requests_total" {
			metric := mf.GetMetric()[0]
			counter := metric.GetCounter()
			if counter.GetValue() != float64(expected) {
				t.Errorf("Counter value = %f, want %f", counter.GetValue(), float64(expected))
			}
			return
		}
	}
}

func TestPrometheusMiddleware_CustomNamespace(t *testing.T) {
	gin.SetMode(gin.TestMode)

	config := DefaultMetricsConfig()
	config.Namespace = "customapi"
	config.Subsystem = "web"

	m := NewPrometheusMiddleware(config)

	router := gin.New()
	router.Use(m.Middleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	metrics := m.GetRegistry()
	metricFamilies, err := metrics.Gather()
	if err != nil {
		t.Fatalf("Failed to gather metrics: %v", err)
	}

	// Check that custom namespace is used
	for _, mf := range metricFamilies {
		if strings.HasPrefix(mf.GetName(), "customapi_web_") {
			return // Success
		}
	}
	t.Error("Custom namespace not found in metrics")
}

func TestNormalizePath(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"/api/users", "/api/users"},
		{"/api/users/123", "/api/users/:id"},
		{"/api/posts/abc-def-ghi-jkl-mno-pqr-stu-vwx-yz", "/api/posts/:id"},
		{"/api/items/999999", "/api/items/:id"},
		{"/health", "/health"},
		{"/", "/"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := normalizePath(tt.input)
			if result != tt.expected {
				t.Errorf("normalizePath(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestStatusCodeLabel(t *testing.T) {
	tests := []struct {
		status   int
		expected string
	}{
		{200, "2xx"},
		{201, "2xx"},
		{299, "2xx"},
		{301, "3xx"},
		{302, "3xx"},
		{400, "4xx"},
		{404, "4xx"},
		{499, "4xx"},
		{500, "5xx"},
		{503, "5xx"},
		{100, "other"},
		{0, "other"},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("%d -> %s", tt.status, tt.expected), func(t *testing.T) {
			result := statusCodeLabel(tt.status)
			if result != tt.expected {
				t.Errorf("statusCodeLabel(%d) = %q, want %q", tt.status, result, tt.expected)
			}
		})
	}
}

func TestPrometheusMiddleware_JSONMetrics(t *testing.T) {
	gin.SetMode(gin.TestMode)
	m := NewPrometheusMiddleware(DefaultMetricsConfig())

	router := gin.New()
	router.Use(m.Middleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Get metrics as JSON
	metrics := m.GetRegistry()
	metricFamilies, _ := metrics.Gather()
	found := false
	for _, mf := range metricFamilies {
		if strings.Contains(mf.GetName(), "requests_total") {
			found = true
			if mf.GetType() != dto.MetricType_COUNTER {
				t.Errorf("Metric type = %v, want COUNTER", mf.GetType().String())
			}
			break
		}
	}

	if !found {
		t.Error("requests_total metric not found in gathered metrics")
	}
}

func TestLooksLikeID(t *testing.T) {
	tests := []struct {
		input  string
		want   bool
	}{
		{"12345678-1234-1234-1234-123456789abc", true},  // UUID
		{"550e8400-e29b-41d4-a716-446655440000", true},  // UUID
		{"123", true},                                    // Numeric ID
		{"12345678901234567890", true},                   // Long numeric ID
		{"user-profile", false},                          // Not an ID
		{"123-abc", false},                              // Not an ID
		{"", false},                                      // Empty
		{"short", false},                                 // Text
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := looksLikeID(tt.input)
			if result != tt.want {
				t.Errorf("looksLikeID(%q) = %v, want %v", tt.input, result, tt.want)
			}
		})
	}
}

// TestPrometheusMiddleware_ResponseWriterWrapper tests the responseWriter structure
func TestPrometheusMiddleware_ResponseWriterWrapper(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("responseWriter struct has correct fields", func(t *testing.T) {
		// Just verify the struct exists with correct field types
		w := &responseWriter{
			status: 200,
			size:   0,
		}

		if w.status != 200 {
			t.Errorf("status = %d, want 200", w.status)
		}
		if w.size != 0 {
			t.Errorf("size = %d, want 0", w.size)
		}
	})

	t.Run("statusCodeLabel returns correct labels", func(t *testing.T) {
		tests := []struct {
			status   int
			expected string
		}{
			{200, "2xx"},
			{300, "3xx"},
			{400, "4xx"},
			{500, "5xx"},
			{0, "other"},
		}

		for _, tt := range tests {
			t.Run(tt.expected, func(t *testing.T) {
				result := statusCodeLabel(tt.status)
				if result != tt.expected {
					t.Errorf("statusCodeLabel(%d) = %s, want %s", tt.status, result, tt.expected)
				}
			})
		}
	})
}
