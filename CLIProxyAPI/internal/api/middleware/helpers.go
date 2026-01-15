// Package middleware provides helper functions for HTTP middleware components.
package middleware

import (
	"strconv"
	"strings"
)

// isHealthCheckPath checks if a path is a health check endpoint
func isHealthCheckPath(path string) bool {
	return path == "/health" || path == "/healthz" || path == "/ready" || path == "/"
}

// isManagementPath checks if a path is a management endpoint
func isManagementPath(path string) bool {
	return path == "/management.html" ||
		path == "/keep-alive" ||
		strings.HasPrefix(path, "/anthropic/callback") ||
		strings.HasPrefix(path, "/codex/callback") ||
		strings.HasPrefix(path, "/google/callback") ||
		strings.HasPrefix(path, "/iflow/callback") ||
		strings.HasPrefix(path, "/antigravity/callback") ||
		strings.HasPrefix(path, "/v0/management")
}

// itoa converts an integer to a string
func itoa(i int) string {
	return strconv.Itoa(i)
}
