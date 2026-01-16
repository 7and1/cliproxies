// Package middleware provides security-related HTTP middleware components for the CLI Proxy API server.
// This file contains security headers, CSP, and other OWASP-recommended security middleware.
package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// SecurityHeadersConfig holds configuration for security headers
type SecurityHeadersConfig struct {
	// HSTS enabled
	HSTSEnabled bool
	// HSTS max age in seconds
	HSTSMaxAge int
	// HSTS include subdomains
	HSTSIncludeSubdomains bool
	// HSTS preload
	HTTPSPreload bool
	// Enable CSP
	CSPEnabled bool
	// CSP policy (formatted as header value)
	CSPPolicy string
	// Frame options
	FrameOptions string
	// Content type options
	ContentTypeOptions string
	// Referrer policy
	ReferrerPolicy string
	// Permissions policy
	PermissionsPolicy string
	// Cross origin policies
	CrossOriginOpenerPolicy   string
	CrossOriginResourcePolicy string
	CrossOriginEmbedderPolicy string
}

// DefaultSecurityHeadersConfig returns OWASP-recommended defaults
func DefaultSecurityHeadersConfig() SecurityHeadersConfig {
	return SecurityHeadersConfig{
		HSTSEnabled:           true,
		HSTSMaxAge:            31536000, // 1 year
		HSTSIncludeSubdomains: true,
		HTTPSPreload:          true,
		CSPEnabled:            true,
		CSPPolicy:             "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; block-all-mixed-content",
		FrameOptions:          "DENY",
		ContentTypeOptions:    "nosniff",
		ReferrerPolicy:        "strict-origin-when-cross-origin",
		PermissionsPolicy:     "camera=(), microphone=(), geolocation=(), interest-cohort=()",
		CrossOriginOpenerPolicy:   "same-origin",
		CrossOriginResourcePolicy: "same-origin",
		CrossOriginEmbedderPolicy: "require-corp",
	}
}

// SecurityHeadersMiddleware adds OWASP-recommended security headers to all responses
func SecurityHeadersMiddleware(config SecurityHeadersConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		// X-Content-Type-Options: prevents MIME type sniffing
		if config.ContentTypeOptions != "" {
			c.Header("X-Content-Type-Options", config.ContentTypeOptions)
		} else {
			c.Header("X-Content-Type-Options", "nosniff")
		}

		// X-Frame-Options: prevents clickjacking
		if config.FrameOptions != "" {
			c.Header("X-Frame-Options", config.FrameOptions)
		} else {
			c.Header("X-Frame-Options", "DENY")
		}

		// X-XSS-Protection: enables browser XSS filter (legacy but still useful)
		c.Header("X-XSS-Protection", "1; mode=block")

		// Referrer-Policy: controls referrer information
		if config.ReferrerPolicy != "" {
			c.Header("Referrer-Policy", config.ReferrerPolicy)
		} else {
			c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		}

		// Permissions-Policy: restricts browser features
		if config.PermissionsPolicy != "" {
			c.Header("Permissions-Policy", config.PermissionsPolicy)
		} else {
			c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")
		}

		// Cross-Origin-Opener-Policy: controls cross-origin opener behavior
		if config.CrossOriginOpenerPolicy != "" {
			c.Header("Cross-Origin-Opener-Policy", config.CrossOriginOpenerPolicy)
		} else {
			c.Header("Cross-Origin-Opener-Policy", "same-origin")
		}

		// Cross-Origin-Resource-Policy: controls cross-origin resource access
		if config.CrossOriginResourcePolicy != "" {
			c.Header("Cross-Origin-Resource-Policy", config.CrossOriginResourcePolicy)
		} else {
			c.Header("Cross-Origin-Resource-Policy", "same-origin")
		}

		// Cross-Origin-Embedder-Policy: controls cross-origin embedder behavior
		if config.CrossOriginEmbedderPolicy != "" {
			c.Header("Cross-Origin-Embedder-Policy", config.CrossOriginEmbedderPolicy)
		} else {
			c.Header("Cross-Origin-Embedder-Policy", "require-corp")
		}

		// Content-Security-Policy: defines approved content sources
		if config.CSPEnabled && config.CSPPolicy != "" {
			c.Header("Content-Security-Policy", config.CSPPolicy)
		}

		// Strict-Transport-Security: enforces HTTPS (only add on HTTPS connections)
		if config.HSTSEnabled && c.Request.TLS != nil {
			maxAge := config.HSTSMaxAge
			if maxAge <= 0 {
				maxAge = 31536000 // 1 year default
			}
			hstsValue := "max-age=" + itoa(maxAge)
			if config.HSTSIncludeSubdomains {
				hstsValue += "; includeSubDomains"
			}
			if config.HTTPSPreload {
				hstsValue += "; preload"
			}
			c.Header("Strict-Transport-Security", hstsValue)
		}

		// X-DNS-Prefetch-Control: controls DNS prefetching
		c.Header("X-DNS-Prefetch-Control", "off")

		// Cache-Control for sensitive endpoints
		if isManagementPath(c.Request.URL.Path) || isHealthCheckPath(c.Request.URL.Path) {
			c.Header("Cache-Control", "no-store, no-cache, must-revalidate, private")
			c.Header("Pragma", "no-cache")
		}

		// Remove server information
		c.Header("Server", "")

		c.Next()
	}
}

// ContentSecurityPolicyConfig holds CSP configuration
type ContentSecurityPolicyConfig struct {
	DefaultSrc    string
	ScriptSrc     string
	StyleSrc      string
	ImgSrc        string
	FontSrc       string
	ConnectSrc    string
	MediaSrc      string
	ObjectSrc     string
	FrameSrc      string
	BaseURI       string
	FormAction    string
	FrameAncestors string
	ManifestSrc   string
	ReportURI     string
	ReportOnly    bool
	UpgradeInsecureRequests bool
}

// DefaultCSPConfig returns a secure default CSP configuration
func DefaultCSPConfig() ContentSecurityPolicyConfig {
	return ContentSecurityPolicyConfig{
		DefaultSrc:          "'self'",
		ScriptSrc:           "'self' 'unsafe-inline' 'unsafe-eval'",
		StyleSrc:            "'self' 'unsafe-inline'",
		ImgSrc:              "'self' data: https: blob:",
		FontSrc:             "'self' data:",
		ConnectSrc:          "'self'",
		MediaSrc:            "'self'",
		ObjectSrc:           "'none'",
		FrameSrc:            "'none'",
		BaseURI:             "'self'",
		FormAction:          "'self'",
		FrameAncestors:      "'none'",
		ManifestSrc:         "'self'",
		UpgradeInsecureRequests: true,
	}
}

// BuildCSPHeader builds a CSP header value from configuration
func BuildCSPHeader(config ContentSecurityPolicyConfig) string {
	directives := make([]string, 0)

	if config.DefaultSrc != "" {
		directives = append(directives, "default-src "+config.DefaultSrc)
	}
	if config.ScriptSrc != "" {
		directives = append(directives, "script-src "+config.ScriptSrc)
	}
	if config.StyleSrc != "" {
		directives = append(directives, "style-src "+config.StyleSrc)
	}
	if config.ImgSrc != "" {
		directives = append(directives, "img-src "+config.ImgSrc)
	}
	if config.FontSrc != "" {
		directives = append(directives, "font-src "+config.FontSrc)
	}
	if config.ConnectSrc != "" {
		directives = append(directives, "connect-src "+config.ConnectSrc)
	}
	if config.MediaSrc != "" {
		directives = append(directives, "media-src "+config.MediaSrc)
	}
	if config.ObjectSrc != "" {
		directives = append(directives, "object-src "+config.ObjectSrc)
	}
	if config.FrameSrc != "" {
		directives = append(directives, "frame-src "+config.FrameSrc)
	}
	if config.BaseURI != "" {
		directives = append(directives, "base-uri "+config.BaseURI)
	}
	if config.FormAction != "" {
		directives = append(directives, "form-action "+config.FormAction)
	}
	if config.FrameAncestors != "" {
		directives = append(directives, "frame-ancestors "+config.FrameAncestors)
	}
	if config.ManifestSrc != "" {
		directives = append(directives, "manifest-src "+config.ManifestSrc)
	}
	if config.ReportURI != "" {
		directives = append(directives, "report-uri "+config.ReportURI)
	}
	if config.UpgradeInsecureRequests {
		directives = append(directives, "upgrade-insecure-requests")
	}

	return strings.Join(directives, "; ")
}

// InputSanitizationMiddleware provides basic input sanitization for query parameters
func InputSanitizationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Sanitize query parameters
		for key, values := range c.Request.URL.Query() {
			sanitized := make([]string, 0, len(values))
			for _, value := range values {
				sanitized = append(sanitized, sanitizeInput(value))
			}
			if len(sanitized) > 0 {
				c.Request.URL.Query()[key] = sanitized
			}
		}

		// Check for path traversal attempts
		if containsPathTraversal(c.Request.URL.Path) {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"error": "invalid request path",
			})
			return
		}

		c.Next()
	}
}

// sanitizeInput removes potentially dangerous characters from input
func sanitizeInput(input string) string {
	// Limit input length to prevent DoS
	if len(input) > 10000 {
		input = input[:10000]
	}

	// Remove null bytes and control characters (except tab, newline, carriage return)
	result := strings.Builder{}
	for _, r := range input {
		if r == 0 {
			continue // Skip null bytes
		}
		if r < 32 && r != 9 && r != 10 && r != 13 {
			continue // Skip control characters except tab, LF, CR
		}
		result.WriteRune(r)
	}

	return result.String()
}

// containsPathTraversal checks for path traversal attempts
func containsPathTraversal(path string) bool {
	pathTraversalPatterns := []string{
		"../", "..\\", "%2e%2e", "%252e", "..;", "%2e%2e%2f", "%2e%2e%5c",
		".../....", "....\\\\", "%c0%ae", "%c1%9c",
	}
	lowerPath := strings.ToLower(path)
	for _, pattern := range pathTraversalPatterns {
		if strings.Contains(lowerPath, pattern) {
			return true
		}
	}
	return false
}

// RequestSizeLimiterMiddleware limits the maximum request body size
func RequestSizeLimiterMiddleware(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > maxSize {
			c.AbortWithStatusJSON(http.StatusRequestEntityTooLarge, gin.H{
				"error": "request body too large",
			})
			return
		}
		c.Next()
	}
}

// TimeoutMiddleware adds a timeout to request processing
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := contextWithTimeout(c.Request.Context(), timeout)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

func contextWithTimeout(parent context.Context, timeout time.Duration) (context.Context, context.CancelFunc) {
	// Simple wrapper for context.WithTimeout
	return context.WithTimeout(parent, timeout)
}
