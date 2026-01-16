// Package middleware provides security-related HTTP middleware components for the CLI Proxy API server.
// This file contains security middleware tests.
package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestSecurityHeadersMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		config         SecurityHeadersConfig
		expectedHeaders map[string]string
	}{
		{
			name:   "default security headers",
			config: DefaultSecurityHeadersConfig(),
			expectedHeaders: map[string]string{
				"X-Content-Type-Options":     "nosniff",
				"X-Frame-Options":            "DENY",
				"X-XSS-Protection":           "1; mode=block",
				"Referrer-Policy":            "strict-origin-when-cross-origin",
				"Permissions-Policy":         "camera=(), microphone=(), geolocation=(), interest-cohort=()",
				"Cross-Origin-Opener-Policy": "same-origin",
				"Cross-Origin-Resource-Policy": "same-origin",
				"Cross-Origin-Embedder-Policy": "require-corp",
				"X-DNS-Prefetch-Control":     "off",
			},
		},
		{
			name: "custom security headers",
			config: SecurityHeadersConfig{
				FrameOptions:       "SAMEORIGIN",
				ContentTypeOptions: "nosniff",
				ReferrerPolicy:     "no-referrer",
				CSPEnabled:         false,
				HSTSEnabled:        false,
			},
			expectedHeaders: map[string]string{
				"X-Content-Type-Options": "nosniff",
				"X-Frame-Options":        "SAMEORIGIN",
				"Referrer-Policy":        "no-referrer",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(SecurityHeadersMiddleware(tt.config))
			router.GET("/test", func(c *gin.Context) {
				c.String(http.StatusOK, "ok")
			})

			req := httptest.NewRequest("GET", "/test", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			for key, expectedValue := range tt.expectedHeaders {
				actualValue := w.Header().Get(key)
				if actualValue != expectedValue {
					t.Errorf("Expected header %s to be %s, got %s", key, expectedValue, actualValue)
				}
			}
		})
	}
}

func TestBuildCSPHeader(t *testing.T) {
	tests := []struct {
		name     string
		config   ContentSecurityPolicyConfig
		contains []string
	}{
		{
			name:   "default CSP",
			config: DefaultCSPConfig(),
			contains: []string{
				"default-src 'self'",
				"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
				"style-src 'self' 'unsafe-inline'",
				"object-src 'none'",
				"frame-src 'none'",
				"frame-ancestors 'none'",
				"upgrade-insecure-requests",
			},
		},
		{
			name: "custom CSP with report URI",
			config: ContentSecurityPolicyConfig{
				DefaultSrc: "'self'",
				ScriptSrc:  "'self' 'nonce-abc123'",
				ReportURI:  "https://csp.example.com/report",
			},
			contains: []string{
				"default-src 'self'",
				"script-src 'self' 'nonce-abc123'",
				"report-uri https://csp.example.com/report",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := BuildCSPHeader(tt.config)

			for _, expected := range tt.contains {
				if !containsString(result, expected) {
					t.Errorf("Expected CSP to contain %s, got %s", expected, result)
				}
			}
		})
	}
}

func TestSanitizeInput(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "normal input",
			input:    "hello world",
			expected: "hello world",
		},
		{
			name:     "null byte removal",
			input:    "hello\x00world",
			expected: "helloworld",
		},
		{
			name:     "control character removal",
			input:    "hello\x01world",
			expected: "helloworld",
		},
		{
			name:     "preserves tab, LF, CR",
			input:    "hello\t\n\rworld",
			expected: "hello\t\n\rworld",
		},
		{
			name:     "limits length",
			input:    strings.Repeat("a", 20000),
			expected: strings.Repeat("a", 10000),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sanitizeInput(tt.input)
			if len(result) != len(tt.expected) {
				t.Errorf("Expected length %d, got %d", len(tt.expected), len(result))
			}
		})
	}
}

func TestContainsPathTraversal(t *testing.T) {
	tests := []struct {
		name     string
		path     string
		expected bool
	}{
		{
			name:     "normal path",
			path:     "/api/v1/models",
			expected: false,
		},
		{
			name:     "../ traversal",
			path:     "/api/../etc/passwd",
			expected: true,
		},
		{
			name:     "URL encoded traversal",
			path:     "/api/%2e%2e/etc/passwd",
			expected: true,
		},
		{
			name:     "double encoded traversal",
			path:     "/api/%252e%252e/etc/passwd",
			expected: true,
		},
		{
			name:     "backslash traversal",
			path:     "/api\\..\\windows",
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := containsPathTraversal(tt.path)
			if result != tt.expected {
				t.Errorf("Expected %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestRequestSizeLimiterMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(RequestSizeLimiterMiddleware(1024)) // 1KB limit
	router.POST("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Request within limit
	smallBody := strings.Repeat("a", 512)
	req := httptest.NewRequest("POST", "/test", strings.NewReader(smallBody))
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Request exceeding limit
	largeBody := strings.Repeat("a", 2048)
	req = httptest.NewRequest("POST", "/test", strings.NewReader(largeBody))
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("Expected status 413, got %d", w.Code)
	}
}

func TestTimeoutMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(TimeoutMiddleware(100 * time.Millisecond))
	router.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func containsString(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 || indexOfSubstring(s, substr))
}

func indexOfSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
