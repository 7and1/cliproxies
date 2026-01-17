// Package test provides utilities and fixtures for testing
package test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
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
	apipkg "github.com/router-for-me/CLIProxyAPI/v6/internal/api"
)

// TestServer wraps a test HTTP server with common functionality
type TestServer struct {
	Engine      *gin.Engine
	Server      *httptest.Server
	Config      *proxyconfig.Config
	AuthManager *auth.Manager
	AccessMgr   *sdkaccess.Manager
	TempDir     string
	APIServer   *apipkg.Server
}

// NewTestServer creates a new test server instance
func NewTestServer(t *testing.T) *TestServer {
	t.Helper()

	gin.SetMode(gin.TestMode)
	configaccess.Register()

	tmpDir := t.TempDir()
	authDir := filepath.Join(tmpDir, "auth")
	if err := os.MkdirAll(authDir, 0o700); err != nil {
		t.Fatalf("failed to create auth dir: %v", err)
	}

	cfg := &proxyconfig.Config{
		SDKConfig: sdkconfig.SDKConfig{
			APIKeys: []string{"test-key-123", "test-key-456"},
		},
		Port:                   0,
		AuthDir:                authDir,
		Debug:                  true,
		LoggingToFile:          false,
		UsageStatisticsEnabled: false,
	}

	authManager := auth.NewManager(nil, nil, nil)
	accessMgr := sdkaccess.NewManager()

	configPath := filepath.Join(tmpDir, "test-config.yaml")
	engine := gin.New()

	// Add recovery middleware
	engine.Use(gin.Recovery())

	// Create the API server
	apiServer := apipkg.NewServer(cfg, authManager, accessMgr, configPath)

	return &TestServer{
		Engine:      engine,
		Config:      cfg,
		AuthManager: authManager,
		AccessMgr:   accessMgr,
		TempDir:     tmpDir,
		APIServer:   apiServer,
	}
}

// Close closes the test server
func (ts *TestServer) Close() {
	if ts.Server != nil {
		ts.Server.Close()
	}
}

// Request makes a test request to the server
func (ts *TestServer) Request(t *testing.T, method, path string, body io.Reader, headers map[string]string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(method, path, body)
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	w := httptest.NewRecorder()
	if ts.APIServer != nil {
		engine := ts.APIServer.Engine()
		if engine != nil {
			engine.ServeHTTP(w, req)
		}
	} else {
		ts.Engine.ServeHTTP(w, req)
	}

	return w
}

// JSONRequest makes a JSON test request
func (ts *TestServer) JSONRequest(t *testing.T, method, path string, data interface{}) *httptest.ResponseRecorder {
	t.Helper()

	var body io.Reader
	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			t.Fatalf("failed to marshal JSON: %v", err)
		}
		body = bytes.NewReader(jsonData)
	}

	headers := map[string]string{
		"Content-Type": "application/json",
		"Authorization": "Bearer test-key-123",
	}

	return ts.Request(t, method, path, body, headers)
}

// AuthenticatedRequest makes an authenticated request
func (ts *TestServer) AuthenticatedRequest(t *testing.T, method, path, apiKey string, body io.Reader) *httptest.ResponseRecorder {
	t.Helper()

	headers := map[string]string{
		"Authorization": "Bearer " + apiKey,
	}

	return ts.Request(t, method, path, body, headers)
}

// ResponseHelper provides utilities for working with responses
type ResponseHelper struct {
	Recorder *httptest.ResponseRecorder
}

// NewResponseHelper creates a new response helper
func NewResponseHelper(w *httptest.ResponseRecorder) *ResponseHelper {
	return &ResponseHelper{Recorder: w}
}

// StatusCode returns the response status code
func (rh *ResponseHelper) StatusCode() int {
	return rh.Recorder.Code
}

// BodyString returns the response body as string
func (rh *ResponseHelper) BodyString() string {
	return rh.Recorder.Body.String()
}

// BodyJSON unmarshals the response body into the provided interface
func (rh *ResponseHelper) BodyJSON(v interface{}) error {
	return json.Unmarshal(rh.Recorder.Body.Bytes(), v)
}

// Header returns a response header value
func (rh *ResponseHelper) Header(key string) string {
	return rh.Recorder.Header().Get(key)
}

// HasContentType checks if the response has the given content type
func (rh *ResponseHelper) HasContentType(contentType string) bool {
	ct := rh.Header("Content-Type")
	return strings.Contains(ct, contentType)
}

// IsSuccess checks if the response is successful (2xx)
func (rh *ResponseHelper) IsSuccess() bool {
	return rh.StatusCode() >= 200 && rh.StatusCode() < 300
}

// IsClientError checks if the response is a client error (4xx)
func (rh *ResponseHelper) IsClientError() bool {
	return rh.StatusCode() >= 400 && rh.StatusCode() < 500
}

// IsServerError checks if the response is a server error (5xx)
func (rh *ResponseHelper) IsServerError() bool {
	return rh.StatusCode() >= 500 && rh.StatusCode() < 600
}

// Assert helpers

// AssertStatus asserts the response status code
func (rh *ResponseHelper) AssertStatus(t *testing.T, expected int) *ResponseHelper {
	t.Helper()
	if rh.StatusCode() != expected {
		t.Errorf("expected status %d, got %d. Body: %s", expected, rh.StatusCode(), rh.BodyString())
	}
	return rh
}

// AssertSuccess asserts the response is successful
func (rh *ResponseHelper) AssertSuccess(t *testing.T) *ResponseHelper {
	t.Helper()
	if !rh.IsSuccess() {
		t.Errorf("expected success status (2xx), got %d. Body: %s", rh.StatusCode(), rh.BodyString())
	}
	return rh
}

// AssertContentType asserts the response content type
func (rh *ResponseHelper) AssertContentType(t *testing.T, contentType string) *ResponseHelper {
	t.Helper()
	if !rh.HasContentType(contentType) {
		t.Errorf("expected content type %s, got %s", contentType, rh.Header("Content-Type"))
	}
	return rh
}

// AssertJSON asserts the response is JSON
func (rh *ResponseHelper) AssertJSON(t *testing.T) *ResponseHelper {
	t.Helper()
	return rh.AssertContentType(t, "application/json")
}

// AssertHeader asserts a response header value
func (rh *ResponseHelper) AssertHeader(t *testing.T, key, value string) *ResponseHelper {
	t.Helper()
	actual := rh.Header(key)
	if actual != value {
		t.Errorf("expected header %s=%s, got %s", key, value, actual)
	}
	return rh
}

// AssertBodyContains asserts the response body contains a substring
func (rh *ResponseHelper) AssertBodyContains(t *testing.T, substr string) *ResponseHelper {
	t.Helper()
	if !strings.Contains(rh.BodyString(), substr) {
		t.Errorf("expected body to contain %q, got %s", substr, rh.BodyString())
	}
	return rh
}

// AssertBodyNotContains asserts the response body does not contain a substring
func (rh *ResponseHelper) AssertBodyNotContains(t *testing.T, substr string) *ResponseHelper {
	t.Helper()
	if strings.Contains(rh.BodyString(), substr) {
		t.Errorf("expected body to NOT contain %q, got %s", substr, rh.BodyString())
	}
	return rh
}

// MockHttpClient provides a mock HTTP client for testing
type MockHttpClient struct {
	Responses map[string]*MockResponse
	Requests  []*http.Request
	mu        chan struct{}
}

// MockResponse represents a mock HTTP response
type MockResponse struct {
	StatusCode int
	Body       []byte
	Headers    map[string]string
	Error      error
	Delay      time.Duration
}

// NewMockHttpClient creates a new mock HTTP client
func NewMockHttpClient() *MockHttpClient {
	return &MockHttpClient{
		Responses: make(map[string]*MockResponse),
		Requests:  make([]*http.Request, 0),
		mu:        make(chan struct{}, 1),
	}
}

// SetResponse sets a mock response for a method and path
func (m *MockHttpClient) SetResponse(method, path string, resp *MockResponse) {
	key := method + ":" + path
	m.Responses[key] = resp
}

// Do implements the HTTP client interface
func (m *MockHttpClient) Do(req *http.Request) (*http.Response, error) {
	func() {
		m.mu <- struct{}{}
		defer func() { <-m.mu }()
		m.Requests = append(m.Requests, req)
	}()

	key := req.Method + ":" + req.URL.Path
	resp, ok := m.Responses[key]
	if !ok {
		resp = &MockResponse{
			StatusCode: http.StatusNotFound,
			Body:       []byte("not found"),
		}
	}

	if resp.Delay > 0 {
		time.Sleep(resp.Delay)
	}

	if resp.Error != nil {
		return nil, resp.Error
	}

	httpResp := &http.Response{
		StatusCode: resp.StatusCode,
		Body:       io.NopCloser(bytes.NewReader(resp.Body)),
		Header:     make(http.Header),
	}

	for k, v := range resp.Headers {
		httpResp.Header.Set(k, v)
	}

	return httpResp, nil
}

// GetRequestCount returns the number of requests made
func (m *MockHttpClient) GetRequestCount() int {
	return len(m.Requests)
}

// GetLastRequest returns the last request made
func (m *MockHttpClient) GetLastRequest() *http.Request {
	if len(m.Requests) == 0 {
		return nil
	}
	return m.Requests[len(m.Requests)-1]
}

// GetRequests returns all requests made
func (m *MockHttpClient) GetRequests() []*http.Request {
	return m.Requests
}

// Clear clears the request history
func (m *MockHttpClient) Clear() {
	func() {
		m.mu <- struct{}{}
		defer func() { <-m.mu }()
		m.Requests = make([]*http.Request, 0)
	}()
}

// Context helpers

// WithTimeout creates a context with timeout
func WithTimeout(t *testing.T, timeout time.Duration) context.Context {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	t.Cleanup(cancel)
	return ctx
}

// WithDeadline creates a context with deadline
func WithDeadline(t *testing.T, deadline time.Time) context.Context {
	t.Helper()
	ctx, cancel := context.WithDeadline(context.Background(), deadline)
	t.Cleanup(cancel)
	return ctx
}

// File helpers

// TempFile creates a temporary file for testing
func TempFile(t *testing.T, content string) string {
	t.Helper()

	tmpDir := t.TempDir()
	filePath := filepath.Join(tmpDir, "test-file")

	if err := os.WriteFile(filePath, []byte(content), 0o600); err != nil {
		t.Fatalf("failed to write temp file: %v", err)
	}

	return filePath
}

// ReadTempFile reads content from a temp file
func ReadTempFile(t *testing.T, path string) string {
	t.Helper()

	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read temp file: %v", err)
	}

	return string(content)
}

// Assert helpers

// AssertEqual asserts two values are equal
func AssertEqual[T comparable](t *testing.T, expected, actual T, msg ...string) {
	t.Helper()
	if expected != actual {
		t.Helper()
		if len(msg) > 0 {
			t.Errorf("%s: expected %v, got %v", strings.Join(msg, " "), expected, actual)
		} else {
			t.Errorf("expected %v, got %v", expected, actual)
		}
	}
}

// AssertNotEqual asserts two values are not equal
func AssertNotEqual[T comparable](t *testing.T, expected, actual T, msg ...string) {
	t.Helper()
	if expected == actual {
		if len(msg) > 0 {
			t.Errorf("%s: expected %v != %v", strings.Join(msg, " "), expected, actual)
		} else {
			t.Errorf("expected %v != %v", expected, actual)
		}
	}
}

// AssertTrue asserts a condition is true
func AssertTrue(t *testing.T, condition bool, msg ...string) {
	t.Helper()
	if !condition {
		if len(msg) > 0 {
			t.Errorf("%s: expected true", strings.Join(msg, " "))
		} else {
			t.Error("expected true")
		}
	}
}

// AssertFalse asserts a condition is false
func AssertFalse(t *testing.T, condition bool, msg ...string) {
	t.Helper()
	if condition {
		if len(msg) > 0 {
			t.Errorf("%s: expected false", strings.Join(msg, " "))
		} else {
			t.Error("expected false")
		}
	}
}

// AssertNil asserts a value is nil
func AssertNil(t *testing.T, value interface{}, msg ...string) {
	t.Helper()
	if value != nil {
		if len(msg) > 0 {
			t.Errorf("%s: expected nil, got %v", strings.Join(msg, " "), value)
		} else {
			t.Errorf("expected nil, got %v", value)
		}
	}
}

// AssertNotNil asserts a value is not nil
func AssertNotNil(t *testing.T, value interface{}, msg ...string) {
	t.Helper()
	if value == nil {
		if len(msg) > 0 {
			t.Errorf("%s: expected non-nil", strings.Join(msg, " "))
		} else {
			t.Error("expected non-nil")
		}
	}
}

// AssertContains asserts a string contains a substring
func AssertContains(t *testing.T, s, substr string, msg ...string) {
	t.Helper()
	if !strings.Contains(s, substr) {
		if len(msg) > 0 {
			t.Errorf("%s: expected %q to contain %q", strings.Join(msg, " "), s, substr)
		} else {
			t.Errorf("expected %q to contain %q", s, substr)
		}
	}
}

// AssertNotContains asserts a string does not contain a substring
func AssertNotContains(t *testing.T, s, substr string, msg ...string) {
	t.Helper()
	if strings.Contains(s, substr) {
		if len(msg) > 0 {
			t.Errorf("%s: expected %q to NOT contain %q", strings.Join(msg, " "), s, substr)
		} else {
			t.Errorf("expected %q to NOT contain %q", s, substr)
		}
	}
}

// AssertNoError asserts an error is nil
func AssertNoError(t *testing.T, err error, msg ...string) {
	t.Helper()
	if err != nil {
		if len(msg) > 0 {
			t.Errorf("%s: unexpected error: %v", strings.Join(msg, " "), err)
		} else {
			t.Errorf("unexpected error: %v", err)
		}
	}
}

// AssertError asserts an error is not nil
func AssertError(t *testing.T, err error, msg ...string) {
	t.Helper()
	if err == nil {
		if len(msg) > 0 {
			t.Errorf("%s: expected error", strings.Join(msg, " "))
		} else {
			t.Error("expected error")
		}
	}
}

// Retry retries a function until it succeeds or times out
func Retry(t *testing.T, maxAttempts int, delay time.Duration, fn func() error) {
	t.Helper()

	var lastErr error
	for i := 0; i < maxAttempts; i++ {
		if err := fn(); err == nil {
			return
		} else {
			lastErr = err
		}
		if i < maxAttempts-1 {
			time.Sleep(delay)
		}
	}

	if lastErr != nil {
		t.Errorf("retry failed after %d attempts: %v", maxAttempts, lastErr)
	}
}

// Eventually repeatedly checks a condition until it's true
func Eventually(t *testing.T, timeout time.Duration, interval time.Duration, condition func() bool) {
	t.Helper()

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			t.Errorf("condition not met within timeout")
			return
		case <-ticker.C:
			if condition() {
				return
			}
		}
	}
}

// WaitFor waits for a condition to become true
func WaitFor(t *testing.T, condition func() bool, timeout time.Duration) {
	t.Helper()

	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if condition() {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}

	t.Errorf("condition not met within timeout")
}
