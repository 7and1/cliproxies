// Package middleware tests for validation
package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestValidationMiddleware_BodySize(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := DefaultValidatorConfig()
	cfg.MaxBodySize = 100 // Small limit for testing

	router := gin.New()
	router.Use(ValidationMiddleware(cfg))
	router.POST("/test", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	// Request with body exceeding limit
	req := httptest.NewRequest("POST", "/test", strings.NewReader(string(make([]byte, 200))))
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("Expected status 413, got %d", w.Code)
	}
}

func TestValidationMiddleware_QueryLength(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := DefaultValidatorConfig()
	cfg.MaxQueryLength = 50

	router := gin.New()
	router.Use(ValidationMiddleware(cfg))
	router.GET("/test", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	// Request with long query string (use valid URL characters)
	longQuery := "param=" + strings.Repeat("a", 100) // Creates a query longer than 50 chars
	req := httptest.NewRequest("GET", "/test?"+longQuery, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != 414 {
		t.Fatalf("Expected status 414, got %d", w.Code)
	}
}

func TestValidationMiddleware_SkipHealthCheck(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := DefaultValidatorConfig()
	cfg.MaxQueryLength = 10 // Very small

	router := gin.New()
	router.Use(ValidationMiddleware(cfg))
	router.GET("/health", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	// Health check with long query string should still pass
	longQuery := "param=" + strings.Repeat("a", 100)
	req := httptest.NewRequest("GET", "/health?"+longQuery, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Health check should skip validation, got status %d", w.Code)
	}
}

func TestValidationMiddleware_ContentType(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := DefaultValidatorConfig()

	router := gin.New()
	router.Use(ValidationMiddleware(cfg))
	router.POST("/test", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	// Invalid content type
	req := httptest.NewRequest("POST", "/test", strings.NewReader("{}"))
	req.Header.Set("Content-Type", "invalid/type")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnsupportedMediaType {
		t.Fatalf("Expected status 415, got %d", w.Code)
	}

	// Valid content type
	req = httptest.NewRequest("POST", "/test", strings.NewReader("{}"))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Valid content type should pass, got status %d", w.Code)
	}
}

func TestContainsSuspiciousCharacters(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{"normal", "Hello World", false},
		{"with null", "Hello\x00World", true},
		{"with control", "Hello\x01World", true},
		{"tab allowed", "Hello\tWorld", false},
		{"newline", "Hello\nWorld", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := containsSuspiciousCharacters(tt.input)
			if got != tt.want {
				t.Errorf("containsSuspiciousCharacters() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestIsHealthCheckPath(t *testing.T) {
	tests := []struct {
		path string
		want bool
	}{
		{"/health", true},
		{"/healthz", true},
		{"/ready", true},
		{"/", true},
		{"/v1/chat", false},
		{"/test", false},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			got := isHealthCheckPath(tt.path)
			if got != tt.want {
				t.Errorf("isHealthCheckPath(%q) = %v, want %v", tt.path, got, tt.want)
			}
		})
	}
}

func TestIsManagementPath(t *testing.T) {
	tests := []struct {
		path string
		want bool
	}{
		{"/management.html", true},
		{"/keep-alive", true},
		{"/anthropic/callback", true},
		{"/anthropic/callback?code=123", true},
		{"/codex/callback", true},
		{"/google/callback", true},
		{"/iflow/callback", true},
		{"/antigravity/callback", true},
		{"/v0/management/config", true},
		{"/v1/chat", false},
		{"/test", false},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			got := isManagementPath(tt.path)
			if got != tt.want {
				t.Errorf("isManagementPath(%q) = %v, want %v", tt.path, got, tt.want)
			}
		})
	}
}
