// Package api provides health check endpoints for the CLI Proxy API server.
package api

import (
	"context"
	"fmt"
	"net/http"
	"runtime"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/config"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/db"
	sdkaccess "github.com/router-for-me/CLIProxyAPI/v6/sdk/access"
	log "github.com/sirupsen/logrus"
)

// HealthChecker provides health check functionality for the server
type HealthChecker struct {
	cfg          *config.Config
	accessMgr    *sdkaccess.Manager
	dbRepo       *db.Repo
	startTime    time.Time
	mu           sync.RWMutex
	providers    map[string]ProviderHealthChecker
}

// ProviderHealthChecker defines an interface for checking upstream provider health
type ProviderHealthChecker interface {
	// CheckHealth performs a health check on the provider
	CheckHealth(ctx context.Context) (bool, error)
	// Name returns the provider name
	Name() string
}

// NewHealthChecker creates a new health checker instance
func NewHealthChecker(cfg *config.Config, accessMgr *sdkaccess.Manager) *HealthChecker {
	return &HealthChecker{
		cfg:       cfg,
		accessMgr: accessMgr,
		startTime: time.Now(),
		providers: make(map[string]ProviderHealthChecker),
	}
}

// SetDatabase sets the database repository for health checks
func (h *HealthChecker) SetDatabase(repo *db.Repo) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.dbRepo = repo
}

// RegisterProvider registers a provider health checker
func (h *HealthChecker) RegisterProvider(checker ProviderHealthChecker) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.providers[checker.Name()] = checker
}

// UnregisterProvider removes a provider health checker
func (h *HealthChecker) UnregisterProvider(name string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.providers, name)
}

// RegisterRoutes registers health check routes with the Gin engine
func (h *HealthChecker) RegisterRoutes(engine *gin.Engine) {
	engine.GET("/health", h.HealthCheck)
	engine.GET("/healthz", h.HealthCheck)
	engine.GET("/ready", h.ReadinessCheck)
	engine.GET("/health/detail", h.DetailedHealthCheck)
	engine.GET("/health/upstream", h.UpstreamHealthCheck)
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
	allReady := true

	// Check if access manager is ready
	if h.accessMgr != nil {
		if providers := h.accessMgr.Providers(); len(providers) > 0 {
			checks["access_manager"] = gin.H{
				"status":       "ready",
				"num_providers": len(providers),
			}
		} else {
			checks["access_manager"] = gin.H{
				"status":  "not_ready",
				"reason":  "no providers configured",
			}
			allReady = false
		}
	} else {
		checks["access_manager"] = gin.H{
			"status": "not_initialized",
		}
		allReady = false
	}

	// Check configuration
	if h.cfg != nil {
		checks["config"] = gin.H{
			"status": "loaded",
			"port":   h.cfg.Port,
			"host":   h.cfg.Host,
		}
	} else {
		checks["config"] = gin.H{
			"status": "not_loaded",
		}
		allReady = false
	}

	status := http.StatusOK
	if !allReady {
		status = http.StatusServiceUnavailable
	}

	c.JSON(status, gin.H{
		"status":    map[bool]string{true: "ready", false: "not_ready"}[allReady],
		"checks":    checks,
		"timestamp": time.Now().Unix(),
	})
}

// DetailedHealthCheck performs comprehensive health checks
// GET /health/detail
func (h *HealthChecker) DetailedHealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	checks := gin.H{}
	overallStatus := "healthy"
	statusCode := http.StatusOK

	// Database health check
	dbStatus := h.checkDatabase(ctx)
	checks["database"] = dbStatus
	if dbStatus["status"] != "healthy" {
		overallStatus = "degraded"
		statusCode = http.StatusServiceUnavailable
	}

	// Access manager health check
	amStatus := h.checkAccessManager()
	checks["access_manager"] = amStatus
	if amStatus["status"] != "healthy" {
		overallStatus = "degraded"
		statusCode = http.StatusServiceUnavailable
	}

	// Provider health check
	h.mu.RLock()
	providers := make(map[string]ProviderHealthChecker, len(h.providers))
	for k, v := range h.providers {
		providers[k] = v
	}
	h.mu.RUnlock()

	providerChecks := gin.H{}
	for name, checker := range providers {
		healthy, err := checker.CheckHealth(ctx)
		providerStatus := gin.H{
			"status": map[bool]string{true: "healthy", false: "unhealthy"}[healthy],
		}
		if err != nil {
			providerStatus["error"] = err.Error()
		}
		providerChecks[name] = providerStatus
		if !healthy {
			overallStatus = "degraded"
		}
	}
	checks["providers"] = providerChecks

	// Memory health check
	memCheck := h.checkMemory()
	checks["memory"] = memCheck
	if memCheck["status"] != "healthy" {
		overallStatus = "degraded"
	}

	c.JSON(statusCode, gin.H{
		"status":    overallStatus,
		"checks":    checks,
		"timestamp": time.Now().Unix(),
		"uptime":    time.Since(h.startTime).Seconds(),
	})
}

// UpstreamHealthCheck checks the health of upstream providers
// GET /health/upstream
func (h *HealthChecker) UpstreamHealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	h.mu.RLock()
	providers := make(map[string]ProviderHealthChecker, len(h.providers))
	for k, v := range h.providers {
		providers[k] = v
	}
	h.mu.RUnlock()

	results := make(map[string]interface{})
	for name, checker := range providers {
		healthy, err := checker.CheckHealth(ctx)
		result := map[string]interface{}{
			"healthy": healthy,
		}
		if err != nil {
			result["error"] = err.Error()
		}
		results[name] = result
	}

	c.JSON(http.StatusOK, gin.H{
		"providers": results,
		"timestamp": time.Now().Unix(),
	})
}

// checkDatabase performs a database health check
func (h *HealthChecker) checkDatabase(ctx context.Context) gin.H {
	h.mu.RLock()
	repo := h.dbRepo
	h.mu.RUnlock()

	if repo == nil {
		return gin.H{
			"status":  "disabled",
			"message": "database not configured",
		}
	}

	err := repo.Ping(ctx)
	if err != nil {
		log.WithError(err).Warn("Database health check failed")
		return gin.H{
			"status":  "unhealthy",
			"error":   err.Error(),
			"message": "database connection failed",
		}
	}

	return gin.H{
		"status":  "healthy",
		"message": "database connection ok",
	}
}

// checkAccessManager checks the access manager health
func (h *HealthChecker) checkAccessManager() gin.H {
	if h.accessMgr == nil {
		return gin.H{
			"status":  "unhealthy",
			"message": "access manager not initialized",
		}
	}

	providers := h.accessMgr.Providers()
	if len(providers) == 0 {
		return gin.H{
			"status":  "unhealthy",
			"message": "no authentication providers configured",
		}
	}

	return gin.H{
		"status":       "healthy",
		"message":      fmt.Sprintf("%d providers configured", len(providers)),
		"num_providers": len(providers),
	}
}

// checkMemory performs a memory health check
func (h *HealthChecker) checkMemory() gin.H {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// Check if using more than 90% of available memory
	// This is a simplified check; in production you'd want to check actual system memory
	status := "healthy"
	message := "memory usage normal"

	allocMB := m.Alloc / 1024 / 1024
	sysMB := m.Sys / 1024 / 1024

	if allocMB > 1024 { // More than 1GB allocated
		status = "degraded"
		message = fmt.Sprintf("high memory usage: %d MB allocated", allocMB)
	}

	return gin.H{
		"status":         status,
		"message":        message,
		"alloc_mb":       allocMB,
		"sys_mb":         sysMB,
		"num_goroutines": runtime.NumGoroutine(),
		"num_gc":         m.NumGC,
	}
}

// Metrics returns basic server metrics
// GET /metrics (deprecated - use Prometheus metrics instead)
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
