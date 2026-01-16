// Package structured provides structured JSON logging with request ID tracing.
// It replaces the basic logrus formatter with production-ready JSON logging.
package structured

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/config"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/logging"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/util"
	"github.com/router-for-me/CLIProxyAPI/v6/sdk/cliproxy/auth"
	log "github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
)

var (
	configureOnce sync.Once
)

// LogLevel represents the severity level for log entries
type LogLevel string

const (
	// LevelDebug is for debug-level messages
	LevelDebug LogLevel = "debug"
	// LevelInfo is for informational messages
	LevelInfo LogLevel = "info"
	// LevelWarn is for warning messages
	LevelWarn LogLevel = "warn"
	// LevelError is for error messages
	LevelError LogLevel = "error"
	// LevelFatal is for fatal error messages
	LevelFatal LogLevel = "fatal"
)

// Config holds configuration for structured logging
type Config struct {
	// Level is the minimum log level to output
	Level LogLevel
	// Format is the output format: "json" or "text"
	Format string
	// Output is the output destination: "stdout", "stderr", or a file path
	Output string
	// EnableRequestID enables request ID tracing
	EnableRequestID bool
	// EnableStackTrace enables stack traces for error logs
	EnableStackTrace bool
	// TimeFormat is the time format for log timestamps
	TimeFormat string
}

// DefaultConfig returns sensible defaults for structured logging
func DefaultConfig() Config {
	return Config{
		Level:            LevelInfo,
		Format:           "json",
		Output:           "stdout",
		EnableRequestID:  true,
		EnableStackTrace: true,
		TimeFormat:       time.RFC3339,
	}
}

// JSONFormatter implements structured JSON logging
type JSONFormatter struct {
	EnableRequestID  bool
	EnableStackTrace bool
	TimeFormat       string
}

// Format renders a single log entry as JSON
func (f *JSONFormatter) Format(entry *log.Entry) ([]byte, error) {
	data := make(map[string]interface{})
	
	// Set timestamp
	timestamp := entry.Time.Format(f.TimeFormat)
	data["timestamp"] = timestamp
	data["level"] = entry.Level.String()
	data["message"] = entry.Message
	
	// Add request ID if available
	if f.EnableRequestID {
		if reqID, ok := entry.Data["request_id"].(string); ok && reqID != "" {
			data["request_id"] = reqID
		}
	}
	
	// Add caller information
	if entry.Caller != nil {
		data["caller"] = fmt.Sprintf("%s:%d", filepath.Base(entry.Caller.File), entry.Caller.Line)
		data["function"] = entry.Caller.Function
	}
	
	// Add all other fields
	for key, value := range entry.Data {
		if key == "request_id" {
			continue
		}
		data[key] = value
	}
	
	// Add stack trace for errors
	if f.EnableStackTrace && entry.Level >= log.ErrorLevel {
		if err, ok := entry.Data[log.ErrorKey].(error); ok && err != nil {
			data["stack_trace"] = fmt.Sprintf("%+v", err)
		}
	}
	
	// Add context fields if available
	if entry.Context != nil {
		if authID, ok := entry.Context.Value(auth.ContextKeyAuthID).(string); ok {
			data["auth_id"] = authID
		}
		if provider, ok := entry.Context.Value(auth.ContextKeyProvider).(string); ok {
			data["provider"] = provider
		}
	}
	
	var buffer bytes.Buffer
	encoder := log.JSONEncoder{}
	if err := encoder.Encode(data, &buffer); err != nil {
		return nil, fmt.Errorf("failed to encode log entry: %w", err)
	}
	
	return buffer.Bytes(), nil
}

// SetupStructuredLogger configures logrus with structured JSON logging
func SetupStructuredLogger(cfg Config) error {
	var setupErr error
	configureOnce.Do(func() {
		// Set log level
		level, err := log.ParseLevel(string(cfg.Level))
		if err != nil {
			level = log.InfoLevel
		}
		log.SetLevel(level)
		
		// Set formatter
		if strings.ToLower(cfg.Format) == "json" {
			log.SetFormatter(&JSONFormatter{
				EnableRequestID:  cfg.EnableRequestID,
				EnableStackTrace: cfg.EnableStackTrace,
				TimeFormat:       cfg.TimeFormat,
			})
		} else {
			log.SetFormatter(&log.TextFormatter{
				FullTimestamp:   true,
				TimestampFormat: cfg.TimeFormat,
				ForceColors:      cfg.Output == "stdout" || cfg.Output == "stderr",
			})
		}
		
		// Set output
		log.SetReportCaller(true)
		
		// Configure output destination
		switch strings.ToLower(cfg.Output) {
		case "stdout":
			log.SetOutput(os.Stdout)
		case "stderr":
			log.SetOutput(os.Stderr)
		default:
			// File output with rotation
			logDir := filepath.Dir(cfg.Output)
			if logDir == "." || logDir == "" {
				logDir = "logs"
			}
			if err := os.MkdirAll(logDir, 0o755); err != nil {
				setupErr = fmt.Errorf("failed to create log directory: %w", err)
				return
			}
			
			logWriter := &lumberjack.Logger{
				Filename:   cfg.Output,
				MaxSize:    100, // MB
				MaxBackups: 10,
				MaxAge:     30, // days
				Compress:   true,
			}
			log.SetOutput(logWriter)
		}
		
		// Register exit handler
		log.RegisterExitHandler(func() {
			if file, ok := log.Out.(*lumberjack.Logger); ok {
				_ = file.Close()
			}
		})
	})
	
	return setupErr
}

// ConfigureFromConfig sets up structured logging from the application config
func ConfigureFromConfig(cfg *config.Config) error {
	logCfg := DefaultConfig()
	
	if cfg.Debug {
		logCfg.Level = LevelDebug
	}
	
	// Check environment variable for log format
	if format := os.Getenv("LOG_FORMAT"); format != "" {
		logCfg.Format = format
	}
	
	// Check environment variable for log level
	if level := os.Getenv("LOG_LEVEL"); level != "" {
		logCfg.Level = LogLevel(level)
	}
	
	// Set output file if logging to file is enabled
	if cfg.LoggingToFile {
		basePath := "logs"
		if writable := util.WritablePath(); writable != "" {
			basePath = filepath.Join(writable, "logs")
		}
		logCfg.Output = filepath.Join(basePath, "app.log")
	}
	
	return SetupStructuredLogger(logCfg)
}

// RequestIDMiddleware is a Gin middleware that adds request ID to context
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Generate or retrieve request ID
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = logging.GenerateRequestID()
		}
		
		// Store in Gin context
		logging.SetGinRequestID(c, requestID)
		
		// Store in context for logging
		ctx := logging.WithRequestID(c.Request.Context(), requestID)
		c.Request = c.Request.WithContext(ctx)
		
		// Add to response header
		c.Header("X-Request-ID", requestID)
		
		c.Next()
	}
}

// ContextHook adds context information to log entries
type ContextHook struct {
	EnableRequestID bool
}

// Fire implements the logrus Hook interface
func (h *ContextHook) Fire(entry *log.Entry) error {
	if entry.Context == nil {
		return nil
	}
	
	// Add request ID from context
	if h.EnableRequestID {
		if reqID := logging.GetRequestID(entry.Context); reqID != "" {
			entry.Data["request_id"] = reqID
		}
	}
	
	// Add auth information from context
	if authID, ok := entry.Context.Value(auth.ContextKeyAuthID).(string); ok {
		entry.Data["auth_id"] = authID
	}
	if provider, ok := entry.Context.Value(auth.ContextKeyProvider).(string); ok {
		entry.Data["provider"] = provider
	}
	
	return nil
}

// Levels returns all log levels for which this hook should fire
func (h *ContextHook) Levels() []log.Level {
	return log.AllLevels
}

// AddContextHook adds the context hook to logrus
func AddContextHook() {
	hook := &ContextHook{
		EnableRequestID: true,
	}
	log.AddHook(hook)
}

// GetLogLevel returns the current log level
func GetLogLevel() LogLevel {
	level := log.GetLevel()
	switch level {
	case log.DebugLevel:
		return LevelDebug
	case log.InfoLevel:
		return LevelInfo
	case log.WarnLevel:
		return LevelWarn
	case log.ErrorLevel:
		return LevelError
	case log.FatalLevel:
		return LevelFatal
	case log.PanicLevel:
		return LevelError
	default:
		return LevelInfo
	}
}

// SetLogLevel sets the log level dynamically
func SetLogLevel(level LogLevel) error {
	lvl, err := log.ParseLevel(string(level))
	if err != nil {
		return fmt.Errorf("invalid log level %q: %w", level, err)
	}
	log.SetLevel(lvl)
	return nil
}

// WithField creates a logger entry with a single field
func WithField(key string, value interface{}) *log.Entry {
	return log.WithField(key, value)
}

// WithFields creates a logger entry with multiple fields
func WithFields(fields map[string]interface{}) *log.Entry {
	return log.WithFields(fields)
}

// WithError creates a logger entry with an error
func WithError(err error) *log.Entry {
	return log.WithError(err)
}

// WithRequestID creates a logger entry with a request ID
func WithRequestID(requestID string) *log.Entry {
	return log.WithField("request_id", requestID)
}

// Info logs an info message
func Info(args ...interface{}) {
	log.Info(args...)
}

// Infof logs a formatted info message
func Infof(format string, args ...interface{}) {
	log.Infof(format, args...)
}

// Warn logs a warning message
func Warn(args ...interface{}) {
	log.Warn(args...)
}

// Warnf logs a formatted warning message
func Warnf(format string, args ...interface{}) {
	log.Warnf(format, args...)
}

// Error logs an error message
func Error(args ...interface{}) {
	log.Error(args...)
}

// Errorf logs a formatted error message
func Errorf(format string, args ...interface{}) {
	log.Errorf(format, args...)
}

// Debug logs a debug message
func Debug(args ...interface{}) {
	log.Debug(args...)
}

// Debugf logs a formatted debug message
func Debugf(format string, args ...interface{}) {
	log.Debugf(format, args...)
}

// Fatal logs a fatal message and exits
func Fatal(args ...interface{}) {
	log.Fatal(args...)
}

// Fatalf logs a formatted fatal message and exits
func Fatalf(format string, args ...interface{}) {
	log.Fatalf(format, args...)
}

// WithAuthContext creates a context with auth information for logging
func WithAuthContext(parent context.Context, authID, provider string) context.Context {
	ctx := parent
	if authID != "" {
		ctx = context.WithValue(ctx, auth.ContextKeyAuthID, authID)
	}
	if provider != "" {
		ctx = context.WithValue(ctx, auth.ContextKeyProvider, provider)
	}
	return ctx
}
