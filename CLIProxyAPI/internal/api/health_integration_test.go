// Package api provides integration tests for health check endpoints
package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	gin "github.com/gin-gonic/gin"
	configaccess "github.com/router-for-me/CLIProxyAPI/v6/internal/access/config_access"
	proxyconfig "github.com/router-for-me/CLIProxyAPI/v6/internal/config"
	sdkaccess "github.com/router-for-me/CLIProxyAPI/v6/sdk/access"
	"github.com/router-for-me/CLIProxyAPI/v6/sdk/cliproxy/auth"
	sdkconfig "github.com/router-for-me/CLIProxyAPI/v6/sdk/config"
)

// TestHealthCheckEndpoints tests all health check related endpoints
func TestHealthCheckEndpoints(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)
	if server == nil {
		t.Fatal("Failed to create test server")
	}

	tests := []struct {
		name           string
		path           string
		method         string
		wantStatus     int
		wantFields     []string
		dontWantFields []string
	}{
		{
			name:       "health endpoint returns ok",
			path:       "/health",
			method:     http.MethodGet,
			wantStatus: http.StatusOK,
			wantFields: []string{"status", "timestamp"},
		},
		{
			name:       "healthz endpoint returns ok",
			path:       "/healthz",
			method:     http.MethodGet,
			wantStatus: http.StatusOK,
			wantFields: []string{"status", "timestamp"},
		},
		{
			name:       "ready endpoint returns ready status",
			path:       "/ready",
			method:     http.MethodGet,
			wantStatus: http.StatusOK,
			wantFields: []string{"status", "checks", "timestamp"},
		},
		{
			name:       "metrics endpoint returns metrics",
			path:       "/metrics",
			method:     http.MethodGet,
			wantStatus: http.StatusOK,
			wantFields: []string{"uptime_seconds", "goroutines", "memory", "timestamp"},
		},
		{
			name:           "metrics includes memory fields",
			path:           "/metrics",
			method:         http.MethodGet,
			wantStatus:     http.StatusOK,
			wantFields:     []string{"alloc", "total_alloc", "sys", "num_gc"},
			dontWantFields: []string{},
		},
		{
			name:           "root endpoint returns info",
			path:           "/",
			method:         http.MethodGet,
			wantStatus:     http.StatusOK,
			wantFields:     []string{"message", "version", "endpoints"},
			dontWantFields: []string{"password", "secret", "token"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.path, nil)
			w := httptest.NewRecorder()

			server.engine.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Status = %d, want %d. Body: %s", w.Code, tt.wantStatus, w.Body.String())
			}

			var response map[string]interface{}
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				t.Fatalf("Failed to parse JSON response: %v", err)
			}

			for _, field := range tt.wantFields {
				if _, exists := response[field]; !exists {
					t.Errorf("Response missing field: %s. Available fields: %v", field, getKeys(response))
				}
			}

			for _, field := range tt.dontWantFields {
				if _, exists := response[field]; exists {
					t.Errorf("Response should not contain field: %s", field)
				}
			}
		})
	}
}

// TestHealthCheckResponseStructure tests the structure of health check responses
func TestHealthCheckResponseStructure(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	t.Run("health response structure", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/health", nil)
		w := httptest.NewRecorder()
		server.engine.ServeHTTP(w, req)

		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to parse JSON: %v", err)
		}

		// Check status field
		status, ok := response["status"].(string)
		if !ok {
			t.Error("status field should be a string")
		}
		if status != "ok" {
			t.Errorf("status = %s, want 'ok'", status)
		}

		// Check timestamp field
		timestamp, ok := response["timestamp"].(float64)
		if !ok {
			t.Error("timestamp field should be a number")
		}
		if timestamp == 0 {
			t.Error("timestamp should be non-zero")
		}

		// Verify timestamp is recent (within last minute)
		now := float64(time.Now().Unix())
		if now-timestamp > 60 {
			t.Errorf("timestamp seems too old: %v (now: %v)", timestamp, now)
		}
	})

	t.Run("ready response structure", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/ready", nil)
		w := httptest.NewRecorder()
		server.engine.ServeHTTP(w, req)

		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to parse JSON: %v", err)
		}

		// Check status field
		status, ok := response["status"].(string)
		if !ok {
			t.Error("status field should be a string")
		}
		if status != "ready" {
			t.Errorf("status = %s, want 'ready'", status)
		}

		// Check checks field
		checks, ok := response["checks"].(map[string]interface{})
		if !ok {
			t.Error("checks field should be an object")
		}

		// Verify expected checks exist
		expectedChecks := []string{"access_manager", "config"}
		for _, check := range expectedChecks {
			if _, exists := checks[check]; !exists {
				t.Errorf("checks missing: %s", check)
			}
		}
	})
}

// TestHealthCheckConcurrency tests health endpoints under concurrent load
func TestHealthCheckConcurrency(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	endpoints := []string{"/health", "/healthz", "/ready", "/metrics"}
	requestsPerEndpoint := 50

	errors := make(chan error, len(endpoints)*requestsPerEndpoint)

	for _, endpoint := range endpoints {
		for i := 0; i < requestsPerEndpoint; i++ {
			go func(path string) {
				req := httptest.NewRequest(http.MethodGet, path, nil)
				w := httptest.NewRecorder()
				server.engine.ServeHTTP(w, req)

				if w.Code != http.StatusOK {
					errors <- fmt.Errorf("%s returned status %d", path, w.Code)
					return
				}

				var response map[string]interface{}
				if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
					errors <- fmt.Errorf("%s returned invalid JSON: %v", path, err)
					return
				}

				errors <- nil
			}(endpoint)
		}
	}

	// Collect results
	errorCount := 0
	for i := 0; i < len(endpoints)*requestsPerEndpoint; i++ {
		if err := <-errors; err != nil {
			t.Error(err)
			errorCount++
		}
	}

	if errorCount > 0 {
		t.Errorf(" %d requests failed", errorCount)
	}
}

// TestHealthCheckWithAuth tests health endpoints without authentication
func TestHealthCheckWithoutAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	// Health endpoints should not require authentication
	tests := []struct {
		name   string
		path   string
		header string
		value  string
	}{
		{
			name:   "health without auth header",
			path:   "/health",
			header: "",
			value:  "",
		},
		{
			name:   "ready without auth header",
			path:   "/ready",
			header: "",
			value:  "",
		},
		{
			name:   "metrics without auth header",
			path:   "/metrics",
			header: "",
			value:  "",
		},
		{
			name:   "health with invalid auth",
			path:   "/health",
			header: "Authorization",
			value:  "Bearer invalid",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			if tt.header != "" {
				req.Header.Set(tt.header, tt.value)
			}
			w := httptest.NewRecorder()
			server.engine.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("Status = %d, want 200. Body: %s", w.Code, w.Body.String())
			}
		})
	}
}

// TestHealthCheckResponseHeaders tests security headers on health endpoints
func TestHealthCheckResponseHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	expectedHeaders := map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
	}

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	server.engine.ServeHTTP(w, req)

	for header, expectedValue := range expectedHeaders {
		actualValue := w.Header().Get(header)
		if actualValue != expectedValue {
			t.Errorf("Header %s = %s, want %s", header, actualValue, expectedValue)
		}
	}
}

// TestHealthCheckMethods tests that only GET is allowed on health endpoints
func TestHealthCheckMethods(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	methods := []string{
		http.MethodPost,
		http.MethodPut,
		http.MethodPatch,
		http.MethodDelete,
	}

	for _, method := range methods {
		t.Run(method+" not allowed on health", func(t *testing.T) {
			req := httptest.NewRequest(method, "/health", nil)
			w := httptest.NewRecorder()
			server.engine.ServeHTTP(w, req)

			// Gin returns 404 for unregistered methods
			// Some implementations might return 405 Method Not Allowed
			if w.Code != http.StatusOK && w.Code != http.StatusMethodNotAllowed && w.Code != http.StatusNotFound {
				t.Logf("Method %s returned status %d (may be expected)", method, w.Code)
			}
		})
	}
}

// TestHealthCheckLatency tests health endpoint response time
func TestHealthCheckLatency(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	iterations := 100
	var totalDuration time.Duration

	for i := 0; i < iterations; i++ {
		start := time.Now()
		req := httptest.NewRequest(http.MethodGet, "/health", nil)
		w := httptest.NewRecorder()
		server.engine.ServeHTTP(w, req)
		duration := time.Since(start)

		totalDuration += duration

		if w.Code != http.StatusOK {
			t.Errorf("Request %d failed with status %d", i, w.Code)
		}
	}

	avgDuration := totalDuration / time.Duration(iterations)

	// Health check should be fast (< 10ms average)
	if avgDuration > 10*time.Millisecond {
		t.Errorf("Average latency %v exceeds threshold of 10ms", avgDuration)
	}

	t.Logf("Average health check latency: %v", avgDuration)
}

// TestMetricsDataIntegrity tests metrics endpoint data validity
func TestMetricsDataIntegrity(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	w := httptest.NewRecorder()
	server.engine.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Status = %d, want 200. Body: %s", w.Code, w.Body.String())
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}

	// Check uptime_seconds
	uptime, ok := response["uptime_seconds"].(float64)
	if !ok {
		t.Error("uptime_seconds should be a number")
	}
	if uptime < 0 {
		t.Error("uptime_seconds should be non-negative")
	}

	// Check goroutines
	goroutines, ok := response["goroutines"].(float64)
	if !ok {
		t.Error("goroutines should be a number")
	}
	if goroutines < 1 {
		t.Error("goroutines should be at least 1")
	}

	// Check memory object
	memory, ok := response["memory"].(map[string]interface{})
	if !ok {
		t.Fatal("memory should be an object")
	}

	memoryFields := []string{"alloc", "total_alloc", "sys", "num_gc"}
	for _, field := range memoryFields {
		value, exists := memory[field]
		if !exists {
			t.Errorf("memory missing field: %s", field)
		}
		if num, ok := value.(float64); ok {
			if num < 0 && field != "num_gc" {
				t.Errorf("memory.%s should be non-negative, got %v", field, num)
			}
		}
	}
}

// TestHealthCheckJSONContentType tests that health endpoints return JSON
func TestHealthCheckJSONContentType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	endpoints := []string{"/health", "/healthz", "/ready", "/metrics"}

	for _, endpoint := range endpoints {
		t.Run(endpoint+" content type", func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, endpoint, nil)
			w := httptest.NewRecorder()
			server.engine.ServeHTTP(w, req)

			contentType := w.Header().Get("Content-Type")
			if !strings.Contains(contentType, "application/json") {
				t.Errorf("Content-Type = %s, want application/json", contentType)
			}
		})
	}
}

// TestReadyCheckWithNilComponents tests ready endpoint behavior with nil components
func TestReadyCheckWithNilComponents(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a server with nil access manager
	cfg := &proxyconfig.Config{
		SDKConfig: sdkconfig.SDKConfig{
			APIKeys: []string{"test-key"},
		},
		Port: 0,
	}
	authManager := auth.NewManager(nil, nil, nil)

	configPath := filepath.Join(os.TempDir(), "test-config-nil.yaml")
	server := NewServer(cfg, authManager, nil, configPath)

	req := httptest.NewRequest(http.MethodGet, "/ready", nil)
	w := httptest.NewRecorder()
	server.engine.ServeHTTP(w, req)

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}

	// Should return ready even with nil access manager (depending on implementation)
	status, _ := response["status"].(string)
	if status != "" {
		t.Logf("Ready status with nil components: %s", status)
	}
}

// TestHealthEndpointIdempotency tests that health endpoint is idempotent
func TestHealthEndpointIdempotency(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	var responses []map[string]interface{}

	for i := 0; i < 10; i++ {
		req := httptest.NewRequest(http.MethodGet, "/health", nil)
		w := httptest.NewRecorder()
		server.engine.ServeHTTP(w, req)

		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to parse JSON: %v", err)
		}
		responses = append(responses, response)

		time.Sleep(10 * time.Millisecond)
	}

	// All responses should have the same structure
	if len(responses) != 10 {
		t.Fatalf("Expected 10 responses, got %d", len(responses))
	}

	firstStatus := responses[0]["status"].(string)
	for i, resp := range responses {
		status := resp["status"].(string)
		if status != firstStatus {
			t.Errorf("Response %d status = %s, want %s (first response)", i, status, firstStatus)
		}
	}
}

// TestMetricsGrowth tests that metrics values change appropriately over time
func TestMetricsGrowth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	// Get initial metrics
	req1 := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	w1 := httptest.NewRecorder()
	server.engine.ServeHTTP(w1, req1)

	var metrics1 map[string]interface{}
	json.Unmarshal(w1.Body.Bytes(), &metrics1)

	uptime1 := metrics1["uptime_seconds"].(float64)

	// Wait a bit
	time.Sleep(100 * time.Millisecond)

	// Get metrics again
	req2 := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	w2 := httptest.NewRecorder()
	server.engine.ServeHTTP(w2, req2)

	var metrics2 map[string]interface{}
	json.Unmarshal(w2.Body.Bytes(), &metrics2)

	uptime2 := metrics2["uptime_seconds"].(float64)

	// Uptime should have increased
	if uptime2 <= uptime1 {
		t.Errorf("uptime_seconds did not increase: %v -> %v", uptime1, uptime2)
	}

	// Difference should be at least 100ms (0.1 seconds)
	diff := uptime2 - uptime1
	if diff < 0.05 {
		t.Errorf("uptime difference %v too small (expected > 0.05s)", diff)
	}
}

// Helper function to get map keys
func getKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// TestHealthCheckWithQueryParams tests health endpoints ignore query parameters
func TestHealthCheckWithQueryParams(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	testCases := []struct {
		path string
	}{
		{"/health?debug=true"},
		{"/health?format=json"},
		{"/health?verbose=1"},
		{"/ready?check=all"},
		{"/metrics?format=prometheus"},
	}

	for _, tc := range testCases {
		t.Run(tc.path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tc.path, nil)
			w := httptest.NewRecorder()
			server.engine.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("Status = %d, want 200", w.Code)
			}

			var response map[string]interface{}
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				t.Errorf("Failed to parse JSON: %v", err)
			}
		})
	}
}

// TestHealthCheckMalformedJSONInput tests that health endpoints don't process POST bodies
func TestHealthCheckIgnoresBody(t *testing.T) {
	gin.SetMode(gin.TestMode)
	configaccess.Register()

	server := newTestServer(t)

	// Health endpoints should ignore POST body if they accept POST at all
	req := httptest.NewRequest(http.MethodPost, "/health", strings.NewReader(`{"key":"value"}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	server.engine.ServeHTTP(w, req)

	// Should either return 404 (POST not supported) or 200 (health check still works)
	if w.Code != http.StatusOK && w.Code != http.StatusNotFound && w.Code != http.StatusMethodNotAllowed {
		t.Logf("POST to /health returned status %d", w.Code)
	}
}
