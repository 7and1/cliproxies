// Package security provides audit logging functionality for security events.
// This implements centralized logging of authentication attempts, authorization failures,
// and other security-relevant events for monitoring and incident response.
package security

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/ssh/terminal"
)

// AuditEventType represents the type of security event being logged
type AuditEventType string

const (
	// Authentication events
	EventTypeAuthSuccess       AuditEventType = "auth.success"
	EventTypeAuthFailure       AuditEventType = "auth.failure"
	EventTypeAuthTokenIssued   AuditEventType = "auth.token.issued"
	EventTypeAuthTokenRefresh  AuditEventType = "auth.token.refreshed"
	EventTypeAuthTokenRevoked  AuditEventType = "auth.token.revoked"
	EventTypeAuthSessionExpiry AuditEventType = "auth.session.expired"

	// Authorization events
	EventTypeAccessGranted  AuditEventType = "access.granted"
	EventTypeAccessDenied   AuditEventType = "access.denied"
	EventTypePrivilegeEscalation AuditEventType = "access.privilege.escalation"

	// Management events
	EventTypeConfigChanged  AuditEventType = "config.changed"
	EventTypeKeyAdded       AuditEventType = "key.added"
	EventTypeKeyRemoved     AuditEventType = "key.removed"
	EventTypeKeyRotated     AuditEventType = "key.rotated"

	// Rate limiting events
	EventTypeRateLimitExceeded AuditEventType = "ratelimit.exceeded"

	// Security events
	EventTypeSuspiciousActivity AuditEventType = "security.suspicious"
	EventTypePotentialAttack    AuditEventType = "security.attack.detected"
)

// AuditLevel represents the severity level of an audit event
type AuditLevel string

const (
	AuditLevelCritical AuditLevel = "critical"
	AuditLevelHigh     AuditLevel = "high"
	AuditLevelMedium   AuditLevel = "medium"
	AuditLevelLow      AuditLevel = "low"
	AuditLevelInfo     AuditLevel = "info"
)

// AuditEvent represents a single security audit event
type AuditEvent struct {
	// Timestamp of the event
	Timestamp time.Time `json:"timestamp"`

	// Type of the event
	Type AuditEventType `json:"type"`

	// Severity level
	Level AuditLevel `json:"level"`

	// Actor who performed the action (user ID, API key, IP, etc.)
	Actor string `json:"actor,omitempty"`

	// Actor IP address
	ActorIP string `json:"actor_ip,omitempty"`

	// Actor User-Agent
	ActorUserAgent string `json:"actor_user_agent,omitempty"`

	// Resource that was accessed
	Resource string `json:"resource,omitempty"`

	// Action performed
	Action string `json:"action,omitempty"`

	// Outcome (success, failure, error)
	Outcome string `json:"outcome,omitempty"`

	// Reason for failure (if applicable)
	Reason string `json:"reason,omitempty"`

	// Additional context as key-value pairs
	Context map[string]string `json:"context,omitempty"`

	// Request ID for tracing
	RequestID string `json:"request_id,omitempty"`
}

// AuditLogger is the main audit logging interface
type AuditLogger interface {
	// LogEvent records a security event
	LogEvent(ctx context.Context, event *AuditEvent) error

	// LogAuthSuccess records a successful authentication
	LogAuthSuccess(ctx context.Context, actor, actorIP, method string) error

	// LogAuthFailure records a failed authentication
	LogAuthFailure(ctx context.Context, actor, actorIP, method, reason string) error

	// LogAccessDenied records a denied access attempt
	LogAccessDenied(ctx context.Context, actor, actorIP, resource, reason string) error

	// LogConfigChange records a configuration change
	LogConfigChange(ctx context.Context, actor, actorIP, resource, change string) error

	// LogSecurityEvent records a general security event
	LogSecurityEvent(ctx context.Context, eventType AuditEventType, level AuditLevel, actor, actorIP, message string) error

	// Close closes the audit logger and releases resources
	Close() error
}

// FileAuditLogger writes audit events to a rotating log file
type FileAuditLogger struct {
	mu       sync.Mutex
	file     *os.File
	path     string
	maxSize  int64
	currentSize int64
	logger   *log.Logger
}

// NewFileAuditLogger creates a new file-based audit logger
func NewFileAuditLogger(path string) (*FileAuditLogger, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, fmt.Errorf("failed to create audit log directory: %w", err)
	}

	file, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		return nil, fmt.Errorf("failed to open audit log file: %w", err)
	}

	info, _ := file.Stat()

	logger := log.New()
	logger.SetOutput(file)
	logger.SetFormatter(&log.JSONFormatter{
		TimestampFormat: time.RFC3339,
		DisableHTMLEscape: true,
	})
	logger.SetLevel(log.InfoLevel)

	return &FileAuditLogger{
		file:        file,
		path:        path,
		maxSize:     100 * 1024 * 1024, // 100MB default max file size
		currentSize: info.Size(),
		logger:      logger,
	}, nil
}

// LogEvent records a security event to the audit log
func (l *FileAuditLogger) LogEvent(ctx context.Context, event *AuditEvent) error {
	l.mu.Lock()
	defer l.mu.Unlock()

	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	// Check if we need to rotate the log file
	if l.currentSize > l.maxSize {
		if err := l.rotate(); err != nil {
			// Log rotation failed, but continue logging
			log.WithError(err).Error("failed to rotate audit log")
		}
	}

	// Convert event to JSON and write to log
	eventJSON, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal audit event: %w", err)
	}

	l.logger.WithFields(log.Fields{
		"type":        string(event.Type),
		"level":       string(event.Level),
		"actor":       event.Actor,
		"actor_ip":    event.ActorIP,
		"resource":    event.Resource,
		"outcome":     event.Outcome,
		"request_id":  event.RequestID,
	}).Info(string(eventJSON))

	l.currentSize += int64(len(eventJSON)) + 1 // +1 for newline

	return nil
}

// LogAuthSuccess records a successful authentication
func (l *FileAuditLogger) LogAuthSuccess(ctx context.Context, actor, actorIP, method string) error {
	return l.LogEvent(ctx, &AuditEvent{
		Type:     EventTypeAuthSuccess,
		Level:    AuditLevelInfo,
		Actor:    maskSensitiveData(actor),
		ActorIP:  actorIP,
		Resource: method,
		Outcome:  "success",
	})
}

// LogAuthFailure records a failed authentication
func (l *FileAuditLogger) LogAuthFailure(ctx context.Context, actor, actorIP, method, reason string) error {
	return l.LogEvent(ctx, &AuditEvent{
		Type:     EventTypeAuthFailure,
		Level:    AuditLevelMedium,
		Actor:    maskSensitiveData(actor),
		ActorIP:  actorIP,
		Resource: method,
		Outcome:  "failure",
		Reason:   reason,
	})
}

// LogAccessDenied records a denied access attempt
func (l *FileAuditLogger) LogAccessDenied(ctx context.Context, actor, actorIP, resource, reason string) error {
	return l.LogEvent(ctx, &AuditEvent{
		Type:     EventTypeAccessDenied,
		Level:    AuditLevelMedium,
		Actor:    maskSensitiveData(actor),
		ActorIP:  actorIP,
		Resource: resource,
		Outcome:  "denied",
		Reason:   reason,
	})
}

// LogConfigChange records a configuration change
func (l *FileAuditLogger) LogConfigChange(ctx context.Context, actor, actorIP, resource, change string) error {
	return l.LogEvent(ctx, &AuditEvent{
		Type:     EventTypeConfigChanged,
		Level:    AuditLevelHigh,
		Actor:    maskSensitiveData(actor),
		ActorIP:  actorIP,
		Resource: resource,
		Action:   change,
		Outcome:  "success",
	})
}

// LogSecurityEvent records a general security event
func (l *FileAuditLogger) LogSecurityEvent(ctx context.Context, eventType AuditEventType, level AuditLevel, actor, actorIP, message string) error {
	return l.LogEvent(ctx, &AuditEvent{
		Type:    eventType,
		Level:   level,
		Actor:   maskSensitiveData(actor),
		ActorIP: actorIP,
		Action:  message,
	})
}

// rotate rotates the audit log file
func (l *FileAuditLogger) rotate() error {
	if err := l.file.Close(); err != nil {
		return err
	}

	// Rename current file with timestamp
	timestamp := time.Now().Format("20060102-150405")
	oldPath := l.path + "." + timestamp
	if err := os.Rename(l.path, oldPath); err != nil {
		return err
	}

	// Create new file
	file, err := os.OpenFile(l.path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		return err
	}

	l.file = file
	l.currentSize = 0
	l.logger.SetOutput(file)

	return nil
}

// Close closes the audit logger
func (l *FileAuditLogger) Close() error {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.file.Close()
}

// maskSensitiveData masks sensitive data like API keys
func maskSensitiveData(data string) string {
	if data == "" {
		return ""
	}

	// If the data looks like an API key (long string), mask most of it
	if len(data) > 20 {
		return data[:4] + "****" + data[len(data)-4:]
	}

	// For shorter data, mask half
	if len(data) > 8 {
		half := len(data) / 2
		return data[:half] + "****"
	}

	// For very short data, just return as is
	return data
}

// NopAuditLogger is a no-op audit logger that doesn't log anything
type NopAuditLogger struct{}

// NewNopAuditLogger creates a new no-op audit logger
func NewNopAuditLogger() *NopAuditLogger {
	return &NopAuditLogger{}
}

func (n *NopAuditLogger) LogEvent(ctx context.Context, event *AuditEvent) error {
	return nil
}

func (n *NopAuditLogger) LogAuthSuccess(ctx context.Context, actor, actorIP, method string) error {
	return nil
}

func (n *NopAuditLogger) LogAuthFailure(ctx context.Context, actor, actorIP, method, reason string) error {
	return nil
}

func (n *NopAuditLogger) LogAccessDenied(ctx context.Context, actor, actorIP, resource, reason string) error {
	return nil
}

func (n *NopAuditLogger) LogConfigChange(ctx context.Context, actor, actorIP, resource, change string) error {
	return nil
}

func (n *NopAuditLogger) LogSecurityEvent(ctx context.Context, eventType AuditEventType, level AuditLevel, actor, actorIP, message string) error {
	return nil
}

func (n *NopAuditLogger) Close() error {
	return nil
}

// Global audit logger instance
var globalAuditLogger AuditLogger = NewNopAuditLogger()

// SetAuditLogger sets the global audit logger
func SetAuditLogger(logger AuditLogger) {
	if logger != nil {
		globalAuditLogger = logger
	}
}

// GetAuditLogger returns the global audit logger
func GetAuditLogger() AuditLogger {
	return globalAuditLogger
}

// IsTerminal checks if the output is a terminal (for colored output)
func IsTerminal(w *os.File) bool {
	fd := int(w.Fd())
	return terminal.IsTerminal(fd)
}
