// Package api provides health check endpoints for the CLI Proxy API server.
package api

import (
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/config"
	sdkaccess "github.com/router-for-me/CLIProxyAPI/v6/sdk/access"
)

// HealthChecker provides health check functionality for the server
type HealthChecker struct {
	cfg          *config.Config
	accessMgr    *sdkaccess.Manager
	startTime    time.Time
}

// NewHealthChecker creates a new health checker instance
func NewHealthChecker(cfg *config.Config, accessMgr *sdkaccess.Manager) *HealthChecker {
	return &HealthChecker{
		cfg:       cfg,
		accessMgr: accessMgr,
		startTime: time.Now(),
	}
}

// RegisterRoutes registers health check routes with the Gin engine
func (h *HealthChecker) RegisterRoutes(engine *gin.Engine) {
	engine.GET("/health", h.HealthCheck)
	engine.GET("/healthz", h.HealthCheck)
	engine.GET("/ready", h.ReadinessCheck)
	engine.GET("/metrics", h.Metrics)
}

// HealthCheck returns a simple health status
// GET /health
func (h *HealthChecker) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": time.Now().Unix(),
	})
}

// ReadinessCheck checks if the server is ready to handle requests
// GET /ready
func (h *HealthChecker) ReadinessCheck(c *gin.Context) {
	checks := gin.H{}

	// Check if access manager is ready
	if h.accessMgr != nil {
		checks["access_manager"] = "ready"
	} else {
		checks["access_manager"] = "not_initialized"
	}

	// Check configuration
	if h.cfg != nil {
		checks["config"] = "loaded"
	} else {
		checks["config"] = "not_loaded"
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not_ready",
			"checks": checks,
		})
		return
	}

	// All checks passed
	c.JSON(http.StatusOK, gin.H{
		"status":    "ready",
		"checks":    checks,
		"timestamp": time.Now().Unix(),
	})
}

// Metrics returns basic server metrics
// GET /metrics
func (h *HealthChecker) Metrics(c *gin.Context) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	c.JSON(http.StatusOK, gin.H{
		"uptime_seconds": time.Since(h.startTime).Seconds(),
		"goroutines":     runtime.NumGoroutine(),
		"memory": gin.H{
			"alloc":       m.Alloc,
			"total_alloc": m.TotalAlloc,
			"sys":         m.Sys,
			"num_gc":      m.NumGC,
		},
		"timestamp": time.Now().Unix(),
	})
}
