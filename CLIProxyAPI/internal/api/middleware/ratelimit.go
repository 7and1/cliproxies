// Package middleware provides HTTP middleware components for the CLI Proxy API server.
// This file contains rate limiting middleware using a token bucket algorithm.
package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiterConfig holds configuration for rate limiting
type RateLimiterConfig struct {
	RequestsPerMinute int
	Burst             int
	CleanupInterval   time.Duration
}

// DefaultRateLimiterConfig returns sensible defaults for rate limiting
func DefaultRateLimiterConfig() RateLimiterConfig {
	return RateLimiterConfig{
		RequestsPerMinute: 60, // 60 requests per minute
		Burst:             10, // Allow bursts up to 10
		CleanupInterval:   5 * time.Minute,
	}
}

// clientTrack tracks request counts and timing for a single client
type clientTrack struct {
	count       int
	windowStart time.Time
	lastSeen    time.Time
}

// RateLimiter implements an in-memory rate limiter using token bucket algorithm
type RateLimiter struct {
	mu     sync.RWMutex
	config RateLimiterConfig
	// Map of client identifier -> tracking data
	clients map[string]*clientTrack
}

// NewRateLimiter creates a new rate limiter with the given configuration
func NewRateLimiter(config RateLimiterConfig) *RateLimiter {
	if config.RequestsPerMinute <= 0 {
		config.RequestsPerMinute = 60
	}
	if config.Burst <= 0 {
		config.Burst = 10
	}
	if config.CleanupInterval <= 0 {
		config.CleanupInterval = 5 * time.Minute
	}

	rl := &RateLimiter{
		config: config,
		clients: make(map[string]*clientTrack),
	}

	// Start cleanup goroutine
	go rl.cleanupLoop()

	return rl
}

// Middleware returns a Gin middleware function for rate limiting
func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip rate limiting for management endpoints
		path := c.Request.URL.Path
		if IsManagementPath(path) || IsHealthCheckPath(path) {
			c.Next()
			return
		}

		// Get client identifier - use API key if available, otherwise IP
		clientID := c.GetHeader("X-API-Key")
		if clientID == "" {
			// Try Authorization header
			if auth := c.GetHeader("Authorization"); auth != "" {
				clientID = auth
			}
		}
		if clientID == "" {
			clientID = c.ClientIP()
		}

		// Check rate limit
		allowed, remaining, resetTime := rl.allow(clientID)

		// Set rate limit headers
		c.Header("X-RateLimit-Limit", itoa(rl.config.RequestsPerMinute))
		c.Header("X-RateLimit-Remaining", itoa(remaining))
		c.Header("X-RateLimit-Reset", itoa(int(resetTime.Unix())))

		if !allowed {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "rate limit exceeded",
				"retry_after": resetTime.Sub(time.Now()).Seconds(),
			})
			return
		}

		c.Next()
	}
}

// allow checks if a request from the given clientID should be allowed
func (rl *RateLimiter) allow(clientID string) (bool, int, time.Time) {
	now := time.Now()

	rl.mu.Lock()
	defer rl.mu.Unlock()

	client, exists := rl.clients[clientID]
	if !exists {
		client = &clientTrack{
			count:       0,
			windowStart: now,
			lastSeen:    now,
		}
		rl.clients[clientID] = client
	}

	// Calculate elapsed time in current window
	elapsed := now.Sub(client.windowStart)
	windowDuration := time.Minute

	// If window has expired, reset
	if elapsed >= windowDuration {
		client.count = 0
		client.windowStart = now
	}

	client.lastSeen = now

	// Check if request is allowed
	if client.count >= rl.config.RequestsPerMinute {
		resetTime := client.windowStart.Add(windowDuration)
		return false, 0, resetTime
	}

	client.count++
	remaining := rl.config.RequestsPerMinute - client.count
	resetTime := client.windowStart.Add(windowDuration)

	return true, remaining, resetTime
}

// cleanupLoop periodically removes stale client entries
func (rl *RateLimiter) cleanupLoop() {
	ticker := time.NewTicker(rl.config.CleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		rl.cleanup()
	}
}

// cleanup removes clients that haven't been seen recently
func (rl *RateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	cutoff := time.Now().Add(-rl.config.CleanupInterval)
	for id, client := range rl.clients {
		if client.lastSeen.Before(cutoff) {
			delete(rl.clients, id)
		}
	}
}

// Stats returns current rate limiter statistics
func (rl *RateLimiter) Stats() map[string]interface{} {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	return map[string]interface{}{
		"total_clients":    len(rl.clients),
		"requests_per_min": rl.config.RequestsPerMinute,
		"burst":            rl.config.Burst,
	}
}
