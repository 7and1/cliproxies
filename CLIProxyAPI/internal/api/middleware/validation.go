// Package middleware provides HTTP middleware components for the CLI Proxy API server.
// This file contains input validation middleware.
package middleware

import (
	"io"
	"net/http"
	"strings"
	"unicode"

	"github.com/gin-gonic/gin"
)

// ValidatorConfig holds configuration for input validation
type ValidatorConfig struct {
	MaxBodySize      int64  // Maximum request body size in bytes
	MaxHeaderSize    int    // Maximum header size in bytes
	MaxQueryLength   int    // Maximum query string length
	AllowedOrigins   []string
	RequireAPIKey    bool
}

// DefaultValidatorConfig returns sensible defaults for validation
func DefaultValidatorConfig() ValidatorConfig {
	return ValidatorConfig{
		MaxBodySize:    10 * 1024 * 1024, // 10MB
		MaxHeaderSize:  8192,             // 8KB
		MaxQueryLength: 2048,             // 2KB
		AllowedOrigins: []string{},
		RequireAPIKey:  false,
	}
}

// ValidationMiddleware returns a Gin middleware for input validation
func ValidationMiddleware(config ValidatorConfig) gin.HandlerFunc {
	if config.MaxBodySize <= 0 {
		config.MaxBodySize = 10 * 1024 * 1024
	}
	if config.MaxHeaderSize <= 0 {
		config.MaxHeaderSize = 8192
	}
	if config.MaxQueryLength <= 0 {
		config.MaxQueryLength = 2048
	}

	return func(c *gin.Context) {
		// Skip validation for health checks and management callbacks
		if isHealthCheckPath(c.Request.URL.Path) || isManagementPath(c.Request.URL.Path) {
			c.Next()
			return
		}

		// Validate Content-Type for POST/PUT/PATCH requests
		if c.Request.Method != "GET" && c.Request.Method != "HEAD" && c.Request.Method != "DELETE" {
			contentType := c.GetHeader("Content-Type")
			if contentType != "" && !isValidContentType(contentType) {
				c.AbortWithStatusJSON(http.StatusUnsupportedMediaType, gin.H{
					"error": "unsupported media type",
				})
				return
			}
		}

		// Validate request body size
		if c.Request.ContentLength > config.MaxBodySize {
			c.AbortWithStatusJSON(http.StatusRequestEntityTooLarge, gin.H{
				"error": "request body too large",
			})
			return
		}

		// Validate query string length
		if len(c.Request.URL.RawQuery) > config.MaxQueryLength {
			c.JSON(414, gin.H{ // HTTP 414 URI Too Long
				"error": "query string too long",
			})
			c.Abort()
			return
		}

		// Validate header sizes
		for key, values := range c.Request.Header {
			for _, value := range values {
				if len(key)+len(value) > config.MaxHeaderSize {
					c.AbortWithStatusJSON(http.StatusRequestHeaderFieldsTooLarge, gin.H{
						"error": "header too large",
					})
					return
				}
				// Check for header injection attacks
				if containsSuspiciousCharacters(value) {
					c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
						"error": "invalid header value",
					})
					return
				}
			}
		}

		// Validate API key presence if required
		if config.RequireAPIKey {
			apiKey := c.GetHeader("X-API-Key")
			if apiKey == "" {
				if auth := c.GetHeader("Authorization"); auth != "" {
					if !strings.HasPrefix(auth, "Bearer ") {
						c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
							"error": "invalid authorization header format",
						})
						return
					}
				} else {
					c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
						"error": "missing api key",
					})
					return
				}
			}
		}

		// Wrap body to limit read size
		if c.Request.Body != nil && c.Request.ContentLength > 0 {
			c.Request.Body = &limitedReader{
				reader: io.LimitReader(c.Request.Body, config.MaxBodySize),
				c:      c,
			}
		}

		c.Next()
	}
}

// isValidContentType checks if the content type is valid
func isValidContentType(contentType string) bool {
	contentType = strings.ToLower(contentType)
	validTypes := []string{
		"application/json",
		"multipart/form-data",
		"application/x-www-form-urlencoded",
		"text/plain",
	}
	for _, valid := range validTypes {
		if strings.HasPrefix(contentType, valid) {
			return true
		}
	}
	return false
}

// containsSuspiciousCharacters checks for potential injection attempts
func containsSuspiciousCharacters(s string) bool {
	for _, r := range s {
		// Check for control characters (except tab)
		if r < 32 && r != 9 {
			return true
		}
		// Check for null bytes
		if r == 0 {
			return true
		}
		// Check for suspicious unicode
		if r > unicode.MaxASCII && !unicode.IsPrint(r) {
			return true
		}
	}
	return false
}

// limitedReader wraps a reader and enforces size limits
type limitedReader struct {
	reader io.Reader
	c      *gin.Context
	read   int64
}

func (lr *limitedReader) Read(p []byte) (n int, err error) {
	n, err = lr.reader.Read(p)
	lr.read += int64(n)
	return n, err
}

func (lr *limitedReader) Close() error {
	if closer, ok := lr.reader.(io.Closer); ok {
		return closer.Close()
	}
	return nil
}
