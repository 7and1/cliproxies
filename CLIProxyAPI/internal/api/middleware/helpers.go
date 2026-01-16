// Package middleware provides helper functions for HTTP middleware components.
package middleware

import (
	"strconv"
	"strings"
)

// IsHealthCheckPath checks if a path is a health check endpoint
func IsHealthCheckPath(path string) bool {
	return path == "/health" || path == "/healthz" || path == "/ready" || path == "/" ||
		path == "/health/detail" || path == "/health/upstream"
}

// isHealthCheckPath is an internal alias for IsHealthCheckPath
func isHealthCheckPath(path string) bool {
	return IsHealthCheckPath(path)
}

// IsManagementPath checks if a path is a management endpoint
func IsManagementPath(path string) bool {
	return path == "/management.html" ||
		path == "/keep-alive" ||
		strings.HasPrefix(path, "/anthropic/callback") ||
		strings.HasPrefix(path, "/codex/callback") ||
		strings.HasPrefix(path, "/google/callback") ||
		strings.HasPrefix(path, "/iflow/callback") ||
		strings.HasPrefix(path, "/antigravity/callback") ||
		strings.HasPrefix(path, "/v0/management")
}

// isManagementPath is an internal alias for IsManagementPath
func isManagementPath(path string) bool {
	return IsManagementPath(path)
}

// itoa converts an integer to a string
func itoa(i int) string {
	return strconv.Itoa(i)
}

// Itoa converts an integer to a string (exported version)
func Itoa(i int) string {
	return strconv.Itoa(i)
}
