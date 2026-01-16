package structured

import (
	"context"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/logging"
)

// GetRequestID retrieves the request ID from the context
func GetRequestID(ctx context.Context) string {
	return logging.GetRequestID(ctx)
}

// WithRequestID adds a request ID to the context
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return logging.WithRequestID(ctx, requestID)
}
