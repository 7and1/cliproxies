// Package structured provides structured JSON logging with request ID tracing.
// It replaces the basic logrus formatter with production-ready JSON logging.
//
// # Usage
//
// To enable structured logging, call SetupStructuredLogger with a Config:
//
//	cfg := structured.DefaultConfig()
//	cfg.Format = "json"
//	structured.SetupStructuredLogger(cfg)
//
// To add request ID tracing to your Gin routes:
//
//	engine.Use(structured.RequestIDMiddleware())
//
// To log with request ID from context:
//
//	structured.WithRequestID(requestID).Info("Processing request")
package structured
