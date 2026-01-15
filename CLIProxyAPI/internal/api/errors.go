// Package api provides standardized error response handling for the CLI Proxy API server.
package api

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorResponse represents a standard error response structure
type ErrorResponse struct {
	Error       string `json:"error"`
	Message     string `json:"message,omitempty"`
	RequestID   string `json:"request_id,omitempty"`
	Code        string `json:"code,omitempty"`
	Retryable   bool   `json:"retryable,omitempty"`
_details     map[string]interface{} `json:"-"` // Internal details, not exposed
}

// APIError represents an application error with additional context
type APIError struct {
	StatusCode int
	Code       string
	Message    string
	Err        error
	Retryable  bool
	Details    map[string]interface{}
}

// Error implements the error interface
func (e *APIError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Code, e.Err)
	}
	return e.Code
}

// Unwrap returns the underlying error
func (e *APIError) Unwrap() error {
	return e.Err
}

// Common error constructors
var (
	ErrBadRequest    = &APIError{StatusCode: http.StatusBadRequest, Code: "bad_request", Message: "Invalid request", Retryable: false}
	ErrUnauthorized  = &APIError{StatusCode: http.StatusUnauthorized, Code: "unauthorized", Message: "Authentication required", Retryable: false}
	ErrForbidden     = &APIError{StatusCode: http.StatusForbidden, Code: "forbidden", Message: "Access denied", Retryable: false}
	ErrNotFound      = &APIError{StatusCode: http.StatusNotFound, Code: "not_found", Message: "Resource not found", Retryable: false}
	ErrTooManyReqs   = &APIError{StatusCode: http.StatusTooManyRequests, Code: "rate_limit_exceeded", Message: "Too many requests", Retryable: true}
	ErrInternal      = &APIError{StatusCode: http.StatusInternalServerError, Code: "internal_error", Message: "Internal server error", Retryable: true}
	ErrServiceUnavail = &APIError{StatusCode: http.StatusServiceUnavailable, Code: "service_unavailable", Message: "Service temporarily unavailable", Retryable: true}
	ErrBadGateway    = &APIError{StatusCode: http.StatusBadGateway, Code: "bad_gateway", Message: "Upstream service error", Retryable: true}
)

// NewAPIError creates a new APIError with the given parameters
func NewAPIError(statusCode int, code, message string, retryable bool) *APIError {
	return &APIError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
		Retryable:  retryable,
	}
}

// WrapError wraps an existing error with APIError context
func WrapError(err error, apiErr *APIError) *APIError {
	return &APIError{
		StatusCode: apiErr.StatusCode,
		Code:       apiErr.Code,
		Message:    apiErr.Message,
		Err:        err,
		Retryable:  apiErr.Retryable,
	}
}

// RespondWithError writes a standardized error response to the Gin context
func RespondWithError(c *gin.Context, err error) {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		respondWithAPIError(c, apiErr)
		return
	}

	// Fallback to internal error
	respondWithAPIError(c, &APIError{
		StatusCode: http.StatusInternalServerError,
		Code:       "internal_error",
		Message:    "An unexpected error occurred",
		Err:        err,
		Retryable:  false,
	})
}

// respondWithAPIError writes the API error to the response
func respondWithAPIError(c *gin.Context, apiErr *APIError) {
	response := ErrorResponse{
		Error:     apiErr.Message,
		Code:      apiErr.Code,
		Retryable: apiErr.Retryable,
	}

	// Add request ID if available
	if requestID := c.GetString("request_id"); requestID != "" {
		response.RequestID = requestID
	}

	// Include underlying error message in debug mode
	if apiErr.Err != nil {
		response.Message = apiErr.Err.Error()
	}

	c.JSON(apiErr.StatusCode, response)
}

// RespondWithCreated writes a 201 Created response
func RespondWithCreated(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, gin.H{
		"status": "created",
		"data":   data,
	})
}

// RespondWithOK writes a 200 OK response
func RespondWithOK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"data":   data,
	})
}

// RespondWithAccepted writes a 202 Accepted response
func RespondWithAccepted(c *gin.Context, message string) {
	c.JSON(http.StatusAccepted, gin.H{
		"status":  "accepted",
		"message": message,
	})
}

// RespondWithNoContent writes a 204 No Content response
func RespondWithNoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}
