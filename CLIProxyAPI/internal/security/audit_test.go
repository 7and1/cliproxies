// Package security provides audit logging functionality for security events.
package security

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestMaskSensitiveData(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "short string",
			input:    "short",
			expected: "short",
		},
		{
			name:     "medium string",
			input:    "mediumlength",
			expected: "medi****",
		},
		{
			name:     "API key format",
			input:    "sk-1234567890abcdefghij",
			expected: "sk-1****hij",
		},
		{
			name:     "long token",
			input:    "verylongtokenstringthatlookslikeanaccesstokenwithmorethan20chars",
			expected: "very****hars",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := maskSensitiveData(tt.input)
			if result != tt.expected {
				t.Errorf("maskSensitiveData(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestNopAuditLogger(t *testing.T) {
	logger := NewNopAuditLogger()
	ctx := context.Background()

	// All methods should return nil
	if err := logger.LogEvent(ctx, &AuditEvent{}); err != nil {
		t.Errorf("LogEvent returned error: %v", err)
	}
	if err := logger.LogAuthSuccess(ctx, "user", "127.0.0.1", "password"); err != nil {
		t.Errorf("LogAuthSuccess returned error: %v", err)
	}
	if err := logger.LogAuthFailure(ctx, "user", "127.0.0.1", "password", "invalid"); err != nil {
		t.Errorf("LogAuthFailure returned error: %v", err)
	}
	if err := logger.LogAccessDenied(ctx, "user", "127.0.0.1", "/resource", "unauthorized"); err != nil {
		t.Errorf("LogAccessDenied returned error: %v", err)
	}
	if err := logger.LogConfigChange(ctx, "admin", "127.0.0.1", "config", "updated"); err != nil {
		t.Errorf("LogConfigChange returned error: %v", err)
	}
	if err := logger.LogSecurityEvent(ctx, EventTypeAuthSuccess, AuditLevelInfo, "user", "127.0.0.1", "test"); err != nil {
		t.Errorf("LogSecurityEvent returned error: %v", err)
	}
	if err := logger.Close(); err != nil {
		t.Errorf("Close returned error: %v", err)
	}
}

func TestFileAuditLogger(t *testing.T) {
	tmpDir := t.TempDir()
	logPath := filepath.Join(tmpDir, "audit.log")

	logger, err := NewFileAuditLogger(logPath)
	if err != nil {
		t.Fatalf("Failed to create audit logger: %v", err)
	}
	defer logger.Close()

	ctx := context.Background()

	// Log some events
	err = logger.LogAuthSuccess(ctx, "test-user", "192.168.1.1", "api-key")
	if err != nil {
		t.Errorf("LogAuthSuccess failed: %v", err)
	}

	err = logger.LogAuthFailure(ctx, "bad-user", "192.168.1.2", "password", "invalid credentials")
	if err != nil {
		t.Errorf("LogAuthFailure failed: %v", err)
	}

	err = logger.LogAccessDenied(ctx, "user", "192.168.1.3", "/admin", "insufficient permissions")
	if err != nil {
		t.Errorf("LogAccessDenied failed: %v", err)
	}

	err = logger.LogConfigChange(ctx, "admin", "192.168.1.4", "rate-limit", "enabled")
	if err != nil {
		t.Errorf("LogConfigChange failed: %v", err)
	}

	err = logger.LogSecurityEvent(ctx, EventTypeRateLimitExceeded, AuditLevelHigh, "api-key", "192.168.1.5", "rate limit exceeded")
	if err != nil {
		t.Errorf("LogSecurityEvent failed: %v", err)
	}

	// Verify log file exists and contains data
	info, err := os.Stat(logPath)
	if err != nil {
		t.Errorf("Failed to stat log file: %v", err)
	}

	if info.Size() == 0 {
		t.Error("Log file is empty")
	}

	// Verify file permissions
	mode := info.Mode()
	if mode.Perm() != 0o600 {
		t.Errorf("Log file has incorrect permissions: got %o, want 0600", mode.Perm())
	}
}

func TestGlobalAuditLogger(t *testing.T) {
	// Set a no-op logger
	SetAuditLogger(NewNopAuditLogger())

	logger := GetAuditLogger()
	if logger == nil {
		t.Error("Global audit logger is nil")
	}

	// Should not error
	ctx := context.Background()
	err := logger.LogEvent(ctx, &AuditEvent{
		Type:     EventTypeAuthSuccess,
		Level:    AuditLevelInfo,
		Timestamp: time.Now(),
	})
	if err != nil {
		t.Errorf("Global logger LogEvent failed: %v", err)
	}
}

func TestAuditEventTypes(t *testing.T) {
	// Verify all event types are defined
	eventTypes := []AuditEventType{
		EventTypeAuthSuccess,
		EventTypeAuthFailure,
		EventTypeAuthTokenIssued,
		EventTypeAuthTokenRefresh,
		EventTypeAuthTokenRevoked,
		EventTypeAuthSessionExpiry,
		EventTypeAccessGranted,
		EventTypeAccessDenied,
		EventTypePrivilegeEscalation,
		EventTypeConfigChanged,
		EventTypeKeyAdded,
		EventTypeKeyRemoved,
		EventTypeKeyRotated,
		EventTypeRateLimitExceeded,
		EventTypeSuspiciousActivity,
		EventTypePotentialAttack,
	}

	for _, et := range eventTypes {
		if et == "" {
			t.Errorf("Event type is empty")
		}
	}
}

func TestAuditLevels(t *testing.T) {
	// Verify all audit levels are defined
	levels := []AuditLevel{
		AuditLevelCritical,
		AuditLevelHigh,
		AuditLevelMedium,
		AuditLevelLow,
		AuditLevelInfo,
	}

	for _, level := range levels {
		if level == "" {
			t.Errorf("Audit level is empty")
		}
	}
}
