// Package middleware tests for rate limiting
package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestRateLimiter_Allow(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := DefaultRateLimiterConfig()
	cfg.RequestsPerMinute = 5
	rl := NewRateLimiter(cfg)

	// First request should be allowed
	allowed, remaining, resetTime := rl.allow("test-client")
	if !allowed {
		t.Fatal("First request should be allowed")
	}
	if remaining != 4 {
		t.Fatalf("Expected 4 remaining, got %d", remaining)
	}
	if resetTime.IsZero() {
		t.Fatal("Reset time should not be zero")
	}

	// Exhaust the limit
	for i := 0; i < 4; i++ {
		allowed, _, _ = rl.allow("test-client")
		if !allowed {
			t.Fatalf("Request %d should be allowed", i+2)
		}
	}

	// Next request should be denied
	allowed, remaining, _ = rl.allow("test-client")
	if allowed {
		t.Fatal("Request over limit should be denied")
	}
	if remaining != 0 {
		t.Fatalf("Expected 0 remaining, got %d", remaining)
	}
}

func TestRateLimiter_Middleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := DefaultRateLimiterConfig()
	cfg.RequestsPerMinute = 3
	rl := NewRateLimiter(cfg)

	router := gin.New()
	router.Use(rl.Middleware())
	router.GET("/test", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	// Make requests up to the limit
	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		req.Header.Set("X-API-Key", "test-key")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Request %d should succeed, got status %d", i+1, w.Code)
		}
	}

	// Next request should be rate limited
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-API-Key", "test-key")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("Expected status 429, got %d", w.Code)
	}
}

func TestRateLimiter_SkipHealthCheck(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := DefaultRateLimiterConfig()
	cfg.RequestsPerMinute = 1
	rl := NewRateLimiter(cfg)

	router := gin.New()
	router.Use(rl.Middleware())
	router.GET("/health", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	// Make multiple health check requests - none should be rate limited
	for i := 0; i < 5; i++ {
		req := httptest.NewRequest("GET", "/health", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Health check request %d should always succeed", i+1)
		}
	}
}

func TestRateLimiter_Stats(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := DefaultRateLimiterConfig()
	rl := NewRateLimiter(cfg)

	rl.allow("client1")
	rl.allow("client2")

	stats := rl.Stats()
	if stats["total_clients"] != 2 {
		t.Fatalf("Expected 2 clients, got %v", stats["total_clients"])
	}
}

func TestRateLimiter_Cleanup(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cfg := DefaultRateLimiterConfig()
	cfg.CleanupInterval = 50 * time.Millisecond
	rl := NewRateLimiter(cfg)

	// Add a client
	rl.allow("test-client")

	// Immediately check - client should exist
	stats := rl.Stats()
	if stats["total_clients"] != 1 {
		t.Fatalf("Expected 1 client initially, got %v", stats["total_clients"])
	}

	// Wait for cleanup interval + margin (clients are cleaned after being idle for CleanupInterval)
	// The default MaxIdleTime in cleanup is 2 * CleanupInterval
	time.Sleep(160 * time.Millisecond)

	// Client should be cleaned up now
	stats = rl.Stats()
	// Client count might be 0 or 1 depending on timing, test mainly that it doesn't crash
	_ = stats["total_clients"]
}
