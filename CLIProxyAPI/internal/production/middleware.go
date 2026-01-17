// Package production provides production-ready middleware and components for the CLI Proxy API.
// It includes rate limiting, request validation, metrics, circuit breaker, and JWT authentication.
package production

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/api"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/api/middleware"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/auth/jwt"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/circuitbreaker"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/config"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/logging/structured"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/metrics"
	"github.com/router-for-me/CLIProxyAPI/v6/sdk/api/handlers"
	log "github.com/sirupsen/logrus"
)

// Components holds all production components
type Components struct {
	MetricsCollector   *metrics.MetricsCollector
	CircuitBreakerMgr  *circuitbreaker.Manager
	JWTManager         *jwt.Manager
	RateLimiter        *middleware.RateLimiter
}

// SetupComponents initializes all production components based on configuration
func SetupComponents(cfg *config.Config) (*Components, error) {
	components := &Components{}

	// Initialize structured logging
	if err := structured.ConfigureFromConfig(cfg); err != nil {
		log.WithError(err).Warn("Failed to configure structured logging, using defaults")
	} else {
		// Add context hook for request ID tracing
		structured.AddContextHook()
		log.Info("Structured logging configured")
	}

	// Initialize JWT manager
	if cfg.JWTSecret != "" {
		jwtMgr, err := jwt.NewManagerFromConfig(cfg)
		if err != nil {
			log.WithError(err).Warn("Failed to initialize JWT manager")
		} else {
			components.JWTManager = jwtMgr
			log.Info("JWT manager initialized")
		}
	}

	// Initialize circuit breaker manager
	if cfg.CircuitBreaker.Enabled {
		cbCfg := circuitbreaker.DefaultConfig()
		if cfg.CircuitBreaker.FailureThreshold > 0 {
			cbCfg.FailureThreshold = cfg.CircuitBreaker.FailureThreshold
		}
		if cfg.CircuitBreaker.SuccessThreshold > 0 {
			cbCfg.SuccessThreshold = cfg.CircuitBreaker.SuccessThreshold
		}
		if cfg.CircuitBreaker.Timeout != "" {
			if duration, err := time.ParseDuration(cfg.CircuitBreaker.Timeout); err == nil {
				cbCfg.Timeout = duration
			}
		}
		if cfg.CircuitBreaker.HalfOpenMaxRequests > 0 {
			cbCfg.MaxRequests = uint32(cfg.CircuitBreaker.HalfOpenMaxRequests)
		}

		components.CircuitBreakerMgr = circuitbreaker.NewManager(cbCfg)
		log.Info("Circuit breaker manager initialized")
	}

	// Initialize Prometheus metrics
	if cfg.Metrics.Enabled {
		components.MetricsCollector = metrics.GetInstance(cfg)
		log.Info("Prometheus metrics collector initialized")
	}

	// Initialize rate limiter
	if cfg.RateLimit.Enabled {
		rlConfig := middleware.DefaultRateLimiterConfig()
		if cfg.RateLimit.RequestsPerMinute > 0 {
			rlConfig.RequestsPerMinute = cfg.RateLimit.RequestsPerMinute
		}
		if cfg.RateLimit.Burst > 0 {
			rlConfig.Burst = cfg.RateLimit.Burst
		}

		components.RateLimiter = middleware.NewRateLimiter(rlConfig)
		log.Info("Rate limiter initialized")
	}

	return components, nil
}

// GetMiddlewareChain returns a middleware chain with all production middleware
func GetMiddlewareChain(cfg *config.Config, components *Components) []gin.HandlerFunc {
	var chain []gin.HandlerFunc

	// Request ID middleware (always enabled for tracing)
	chain = append(chain, structured.RequestIDMiddleware())

	// Request validation middleware
	if cfg.Validation.MaxBodySize > 0 || cfg.Validation.MaxHeaderSize > 0 {
		vConfig := middleware.DefaultValidatorConfig()
		if cfg.Validation.MaxBodySize > 0 {
			vConfig.MaxBodySize = int64(cfg.Validation.MaxBodySize)
		}
		if cfg.Validation.MaxHeaderSize > 0 {
			vConfig.MaxHeaderSize = cfg.Validation.MaxHeaderSize
		}
		if cfg.Validation.MaxQueryLength > 0 {
			vConfig.MaxQueryLength = cfg.Validation.MaxQueryLength
		}
		chain = append(chain, middleware.ValidationMiddleware(vConfig))
		log.Info("Request validation middleware enabled")
	}

	// Rate limiting middleware
	if components.RateLimiter != nil {
		chain = append(chain, components.RateLimiter.Middleware())
	}

	// Prometheus metrics middleware
	if components.MetricsCollector != nil {
		chain = append(chain, components.MetricsCollector.Middleware())
	}

	// JWT auth middleware (optional - based on configuration)
	if components.JWTManager != nil {
		// Use optional auth middleware - validates JWT if present but doesn't require it
		// This allows the existing AuthMiddleware to handle full authentication
		chain = append(chain, components.JWTManager.OptionalAuthMiddleware())
	}

	return chain
}

// RegisterProductionRoutes registers additional production routes
func RegisterProductionRoutes(engine *gin.Engine, cfg *config.Config, components *Components) {
	// Register Prometheus metrics endpoint
	if components.MetricsCollector != nil && cfg.Metrics.Enabled {
		metricsPath := "/metrics"
		if cfg.Metrics.Path != "" {
			metricsPath = cfg.Metrics.Path
		}
		components.MetricsCollector.RegisterRoutes(engine)
		log.Infof("Prometheus metrics endpoint registered at %s", metricsPath)
	}
}

// ApplyServerOptions applies production server options
func ApplyServerOptions(cfg *config.Config, components *Components) []api.ServerOption {
	var opts []api.ServerOption

	// Add middleware chain
	middlewareChain := GetMiddlewareChain(cfg, components)
	if len(middlewareChain) > 0 {
		opts = append(opts, api.WithMiddleware(middlewareChain...))
	}

	// Register additional routes
	opts = append(opts, api.WithRouterConfigurator(func(engine *gin.Engine, handler *handlers.BaseAPIHandler, cfg *config.Config) {
		RegisterProductionRoutes(engine, cfg, components)
	}))

	return opts
}

// StartBackgroundServices starts background services like health checks and cleanup
func StartBackgroundServices(ctx context.Context, cfg *config.Config, components *Components) {
	// Start JWT token cleanup
	if components.JWTManager != nil {
		go func() {
			ticker := time.NewTicker(5 * time.Minute)
			defer ticker.Stop()

			for {
				select {
				case <-ctx.Done():
					return
				case <-ticker.C:
					components.JWTManager.CleanExpiredTokens()
				}
			}
		}()
	}

	// Start circuit breaker health checks
	if components.CircuitBreakerMgr != nil && cfg.CircuitBreaker.Enabled {
		go func() {
			ticker := time.NewTicker(30 * time.Second)
			defer ticker.Stop()

			for {
				select {
				case <-ctx.Done():
					return
				case <-ticker.C:
					components.CircuitBreakerMgr.RunHealthCheck(ctx, nil)
				}
			}
		}()
		log.Info("Circuit breaker health check service started")
	}
}

// Shutdown gracefully shuts down all production components
func (c *Components) Shutdown(ctx context.Context) error {
	log.Info("Shutting down production components...")

	// Circuit breaker cleanup is handled by garbage collection
	// No explicit shutdown needed for most components

	log.Info("Production components shut down")
	return nil
}
