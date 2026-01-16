// Package logging tests for structured logging functionality
package logging

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/sirupsen/logrus/hooks/test"
)

// LogLevel represents the severity level of a log entry
type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
	LogLevelFatal LogLevel = "fatal"
	LogLevelPanic LogLevel = "panic"
)

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp time.Time              `json:"timestamp"`
	Level     LogLevel               `json:"level"`
	Message   string                 `json:"message"`
	Fields    map[string]interface{} `json:"fields,omitempty"`
	RequestID string                 `json:"request_id,omitempty"`
	Caller    string                 `json:"caller,omitempty"`
	Error     string                 `json:"error,omitempty"`
}

// StructuredLogger provides structured logging capabilities
type StructuredLogger struct {
	logger      *logrus.Logger
	fields      map[string]interface{}
	mu          sync.RWMutex
	requestIDKey string
}

// NewStructuredLogger creates a new structured logger
func NewStructuredLogger() *StructuredLogger {
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})
	logger.SetLevel(logrus.DebugLevel)

	return &StructuredLogger{
		logger:      logger,
		fields:      make(map[string]interface{}),
		requestIDKey: "request_id",
	}
}

// WithField adds a single field to the logger
func (l *StructuredLogger) WithField(key string, value interface{}) *StructuredLogger {
	l.mu.Lock()
	defer l.mu.Unlock()

	newLogger := l.copy()
	newLogger.fields[key] = value
	return newLogger
}

// WithFields adds multiple fields to the logger
func (l *StructuredLogger) WithFields(fields map[string]interface{}) *StructuredLogger {
	l.mu.Lock()
	defer l.mu.Unlock()

	newLogger := l.copy()
	for k, v := range fields {
		newLogger.fields[k] = v
	}
	return newLogger
}

// WithRequestID adds a request ID to the logger
func (l *StructuredLogger) WithRequestID(id string) *StructuredLogger {
	return l.WithField(l.requestIDKey, id)
}

// WithError adds an error to the logger
func (l *StructuredLogger) WithError(err error) *StructuredLogger {
	if err != nil {
		return l.WithField("error", err.Error())
	}
	return l
}

// Debug logs a debug message
func (l *StructuredLogger) Debug(msg string) {
	l.log(logrus.DebugLevel, msg)
}

// Info logs an info message
func (l *StructuredLogger) Info(msg string) {
	l.log(logrus.InfoLevel, msg)
}

// Warn logs a warning message
func (l *StructuredLogger) Warn(msg string) {
	l.log(logrus.WarnLevel, msg)
}

// Error logs an error message
func (l *StructuredLogger) Error(msg string) {
	l.log(logrus.ErrorLevel, msg)
}

// Fatal logs a fatal message and exits
func (l *StructuredLogger) Fatal(msg string) {
	l.log(logrus.FatalLevel, msg)
}

// Panic logs a panic message and panics
func (l *StructuredLogger) Panic(msg string) {
	l.log(logrus.PanicLevel, msg)
}

// log performs the actual logging operation
func (l *StructuredLogger) log(level logrus.Level, msg string) {
	l.mu.RLock()
	defer l.mu.RUnlock()

	fields := make(logrus.Fields)
	for k, v := range l.fields {
		fields[k] = v
	}

	l.logger.WithFields(fields).Log(level, msg)
}

// copy creates a copy of the logger with independent fields
func (l *StructuredLogger) copy() *StructuredLogger {
	newLogger := &StructuredLogger{
		logger:      l.logger,
		fields:      make(map[string]interface{}),
		requestIDKey: l.requestIDKey,
	}
	for k, v := range l.fields {
		newLogger.fields[k] = v
	}
	return newLogger
}

// SetLevel sets the minimum log level
func (l *StructuredLogger) SetLevel(level LogLevel) {
	switch level {
	case LogLevelDebug:
		l.logger.SetLevel(logrus.DebugLevel)
	case LogLevelInfo:
		l.logger.SetLevel(logrus.InfoLevel)
	case LogLevelWarn:
		l.logger.SetLevel(logrus.WarnLevel)
	case LogLevelError:
		l.logger.SetLevel(logrus.ErrorLevel)
	case LogLevelFatal:
		l.logger.SetLevel(logrus.FatalLevel)
	case LogLevelPanic:
		l.logger.SetLevel(logrus.PanicLevel)
	}
}

// SetOutput sets the output destination
func (l *StructuredLogger) SetOutput(w io.Writer) {
	l.logger.SetOutput(w)
}

// ContextLogger provides context-aware logging
type ContextLogger struct {
	root *StructuredLogger
}

// NewContextLogger creates a new context logger
func NewContextLogger(root *StructuredLogger) *ContextLogger {
	return &ContextLogger{root: root}
}

// FromContext extracts a logger from context or returns the root logger
func (cl *ContextLogger) FromContext(ctx context.Context) *StructuredLogger {
	if reqID, ok := ctx.Value(cl.root.requestIDKey).(string); ok {
		return cl.root.WithRequestID(reqID)
	}
	return cl.root
}

// RequestIDKey returns the request ID context key
func (l *StructuredLogger) RequestIDKey() string {
	return l.requestIDKey
}

// Table-driven tests for structured logging

func TestStructuredLogger_BasicLogging(t *testing.T) {
	tests := []struct {
		name    string
		level   LogLevel
		message string
		want    string
	}{
		{"debug message", LogLevelDebug, "debug message", "debug message"},
		{"info message", LogLevelInfo, "info message", "info message"},
		{"warn message", LogLevelWarn, "warn message", "warn message"},
		{"error message", LogLevelError, "error message", "error message"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var buf bytes.Buffer
			logger := NewStructuredLogger()
			logger.SetOutput(&buf)
			logger.SetLevel(LogLevelDebug)

			switch tt.level {
			case LogLevelDebug:
				logger.Debug(tt.message)
			case LogLevelInfo:
				logger.Info(tt.message)
			case LogLevelWarn:
				logger.Warn(tt.message)
			case LogLevelError:
				logger.Error(tt.message)
			}

			output := buf.String()
			if !strings.Contains(output, tt.want) {
				t.Errorf("Log output should contain %q, got %q", tt.want, output)
			}

			// Verify JSON format
			var entry map[string]interface{}
			if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
				t.Errorf("Log output should be valid JSON: %v", err)
			}

			if entry["message"] != tt.want {
				t.Errorf("message field = %v, want %v", entry["message"], tt.want)
			}
		})
	}
}

func TestStructuredLogger_WithFields(t *testing.T) {
	tests := []struct {
		name   string
		fields map[string]interface{}
		want   map[string]interface{}
	}{
		{
			name: "single field",
			fields: map[string]interface{}{
				"user_id": "123",
			},
			want: map[string]interface{}{
				"user_id": "123",
			},
		},
		{
			name: "multiple fields",
			fields: map[string]interface{}{
				"user_id": "123",
				"action":  "login",
				"ip":      "192.168.1.1",
			},
			want: map[string]interface{}{
				"user_id": "123",
				"action":  "login",
				"ip":      "192.168.1.1",
			},
		},
		{
			name:   "empty fields",
			fields: map[string]interface{}{},
			want:   map[string]interface{}{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var buf bytes.Buffer
			logger := NewStructuredLogger()
			logger.SetOutput(&buf)

			logWithFields := logger.WithFields(tt.fields)
			logWithFields.Info("test message")

			var entry map[string]interface{}
			if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
				t.Fatalf("Failed to parse log output: %v", err)
			}

			for k, v := range tt.want {
				if entry[k] != v {
					t.Errorf("Field %s = %v, want %v", k, entry[k], v)
				}
			}
		})
	}
}

func TestStructuredLogger_WithField(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	logger.
		WithField("user_id", "123").
		WithField("action", "login").
		Info("user logged in")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	if entry["user_id"] != "123" {
		t.Errorf("user_id = %v, want 123", entry["user_id"])
	}

	if entry["action"] != "login" {
		t.Errorf("action = %v, want login", entry["action"])
	}
}

func TestStructuredLogger_WithRequestID(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	logger.WithRequestID("req-123").Info("processing request")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	if entry["request_id"] != "req-123" {
		t.Errorf("request_id = %v, want req-123", entry["request_id"])
	}
}

func TestStructuredLogger_WithError(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	err := io.ErrUnexpectedEOF
	logger.WithError(err).Error("operation failed")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	if entry["error"] != io.ErrUnexpectedEOF.Error() {
		t.Errorf("error field = %v, want %v", entry["error"], io.ErrUnexpectedEOF.Error())
	}
}

func TestStructuredLogger_Chaining(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	// Create logger with chain of WithField calls
	chainedLogger := logger.
		WithField("component", "api").
		WithField("version", "1.0").
		WithRequestID("req-456").
		WithError(io.ErrClosedPipe)

	chainedLogger.Warn("connection issue")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	if entry["component"] != "api" {
		t.Errorf("component = %v, want api", entry["component"])
	}
	if entry["version"] != "1.0" {
		t.Errorf("version = %v, want 1.0", entry["version"])
	}
	if entry["request_id"] != "req-456" {
		t.Errorf("request_id = %v, want req-456", entry["request_id"])
	}
	if entry["error"] == nil {
		t.Error("error field should be set")
	}
}

func TestStructuredLogger_Immutability(t *testing.T) {
	var buf1, buf2 bytes.Buffer
	root := NewStructuredLogger()
	root.SetOutput(&buf1)

	logger1 := root.WithField("field1", "value1")

	// Change output for second logger
	logger2 := logger1.WithField("field2", "value2")

	logger1.Info("message 1")
	logger2.Info("message 2")

	// First buffer should only have field1
	var entry1 map[string]interface{}
	if err := json.Unmarshal(buf1.Bytes(), &entry1); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	if entry1["field1"] != "value1" {
		t.Errorf("field1 = %v, want value1", entry1["field1"])
	}
	if entry1["field2"] != nil {
		t.Error("field2 should not be set in logger1")
	}

	// Second buffer should have both fields
	var entry2 map[string]interface{}
	if err := json.Unmarshal(buf2.Bytes(), &entry2); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	if entry2["field1"] != "value1" {
		t.Errorf("field1 = %v, want value1", entry2["field1"])
	}
	if entry2["field2"] != "value2" {
		t.Errorf("field2 = %v, want value2", entry2["field2"])
	}
}

func TestStructuredLogger_LevelFiltering(t *testing.T) {
	tests := []struct {
		name         string
		setLevel     LogLevel
		logLevel     LogLevel
		shouldOutput bool
	}{
		{"debug level logs debug", LogLevelDebug, LogLevelDebug, true},
		{"debug level logs info", LogLevelDebug, LogLevelInfo, true},
		{"info level filters debug", LogLevelInfo, LogLevelDebug, false},
		{"info level logs info", LogLevelInfo, LogLevelInfo, true},
		{"warn level filters info", LogLevelWarn, LogLevelInfo, false},
		{"warn level logs warn", LogLevelWarn, LogLevelWarn, true},
		{"error level filters warn", LogLevelError, LogLevelWarn, false},
		{"error level logs error", LogLevelError, LogLevelError, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var buf bytes.Buffer
			logger := NewStructuredLogger()
			logger.SetOutput(&buf)
			logger.SetLevel(tt.setLevel)

			switch tt.logLevel {
			case LogLevelDebug:
				logger.Debug("test")
			case LogLevelInfo:
				logger.Info("test")
			case LogLevelWarn:
				logger.Warn("test")
			case LogLevelError:
				logger.Error("test")
			}

			hasOutput := buf.Len() > 0
			if hasOutput != tt.shouldOutput {
				t.Errorf("Output present = %v, want %v", hasOutput, tt.shouldOutput)
			}
		})
	}
}

func TestStructuredLogger_ConcurrentLogging(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	var wg sync.WaitGroup
	goroutines := 100
	messagesPerGoroutine := 50

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < messagesPerGoroutine; j++ {
				logger.
					WithField("goroutine", id).
					WithField("iteration", j).
					Info("concurrent message")
			}
		}(i)
	}

	wg.Wait()

	// Count log entries
	lines := strings.Split(strings.TrimRight(buf.String(), "\n"), "\n")
	if len(lines) != goroutines*messagesPerGoroutine {
		t.Errorf("Expected %d log entries, got %d", goroutines*messagesPerGoroutine, len(lines))
	}

	// Verify all entries are valid JSON
	for i, line := range lines {
		var entry map[string]interface{}
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			t.Errorf("Line %d is not valid JSON: %v", i, err)
		}
	}
}

func TestStructuredLogger_JSONFormatting(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	logger.
		WithField("string", "value").
		WithField("number", 42).
		WithField("float", 3.14).
		WithField("bool", true).
		WithField("nil", nil).
		Info("structured data")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	if entry["string"] != "value" {
		t.Errorf("string field = %v, want value", entry["string"])
	}
	if entry["number"] != float64(42) {
		t.Errorf("number field = %v, want 42", entry["number"])
	}
	if entry["float"] != float64(3.14) {
		t.Errorf("float field = %v, want 3.14", entry["float"])
	}
	if entry["bool"] != true {
		t.Errorf("bool field = %v, want true", entry["bool"])
	}
	if entry["nil"] != nil {
		t.Errorf("nil field = %v, want nil", entry["nil"])
	}
}

func TestStructuredLogger_TimestampField(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	logger.Info("timestamp test")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	if entry["time"] == nil && entry["timestamp"] == nil {
		t.Error("Log entry should have a timestamp field")
	}

	// Verify timestamp is recent if it exists
	if ts, ok := entry["time"].(string); ok {
		parsedTime, err := time.Parse(time.RFC3339, ts)
		if err != nil {
			t.Errorf("Failed to parse timestamp: %v", err)
		}
		if time.Since(parsedTime) > time.Second {
			t.Error("Timestamp is not recent")
		}
	}
}

func TestStructuredLogger_LevelField(t *testing.T) {
	tests := []struct {
		level     LogLevel
		wantLevel string
	}{
		{LogLevelDebug, "debug"},
		{LogLevelInfo, "info"},
		{LogLevelWarn, "warning"},
		{LogLevelError, "error"},
	}

	for _, tt := range tests {
		t.Run(tt.wantLevel, func(t *testing.T) {
			var buf bytes.Buffer
			logger := NewStructuredLogger()
			logger.SetOutput(&buf)

			switch tt.level {
			case LogLevelDebug:
				logger.Debug("test")
			case LogLevelInfo:
				logger.Info("test")
			case LogLevelWarn:
				logger.Warn("test")
			case LogLevelError:
				logger.Error("test")
			}

			var entry map[string]interface{}
			if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
				t.Fatalf("Failed to parse log output: %v", err)
			}

			level, ok := entry["level"].(string)
			if !ok {
				t.Error("level field should be a string")
			} else if level != tt.wantLevel {
				t.Errorf("level = %v, want %v", level, tt.wantLevel)
			}
		})
	}
}

func TestContextLogger_FromContext(t *testing.T) {
	root := NewStructuredLogger()
	cl := NewContextLogger(root)

	tests := []struct {
		name       string
		ctx        context.Context
		wantReqID  string
	}{
		{
			name:      "context with request ID",
			ctx:       context.WithValue(context.Background(), "request_id", "req-789"),
			wantReqID: "req-789",
		},
		{
			name:      "context without request ID",
			ctx:       context.Background(),
			wantReqID: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var buf bytes.Buffer
			root.SetOutput(&buf)

			logger := cl.FromContext(tt.ctx)
			logger.Info("test")

			var entry map[string]interface{}
			if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
				t.Fatalf("Failed to parse log output: %v", err)
			}

			if tt.wantReqID != "" {
				if entry["request_id"] != tt.wantReqID {
					t.Errorf("request_id = %v, want %v", entry["request_id"], tt.wantReqID)
				}
			}
		})
	}
}

func TestStructuredLogger_LargeFieldValues(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	largeValue := strings.Repeat("x", 10000)
	logger.WithField("large", largeValue).Info("large value")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	largeFieldValue, ok := entry["large"].(string)
	if !ok {
		t.Fatal("large field should be a string")
	}
	if len(largeFieldValue) != 10000 {
		t.Errorf("Large value length = %d, want 10000", len(largeFieldValue))
	}
}

func TestStructuredLogger_SpecialCharacters(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	specialValue := "value with \"quotes\" and \n newlines \t tabs"
	logger.WithField("special", specialValue).Info("special chars")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	if entry["special"] != specialValue {
		t.Errorf("special field = %v, want %v", entry["special"], specialValue)
	}
}

func TestStructuredLogger_NestedFields(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	nested := map[string]interface{}{
		"user": map[string]interface{}{
			"id":       "123",
			"username": "testuser",
		},
		"metadata": map[string]interface{}{
			"ip":   "192.168.1.1",
			"city": "San Francisco",
		},
	}

	logger.WithFields(nested).Info("nested fields")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	if entry["user"] == nil {
		t.Error("user field should be present")
	}
	if entry["metadata"] == nil {
		t.Error("metadata field should be present")
	}
}

func TestStructuredLogger_ArrayFields(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	arr := []interface{}{"item1", "item2", 123, true}
	logger.WithField("items", arr).Info("array field")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	items, ok := entry["items"].([]interface{})
	if !ok {
		t.Fatal("items field should be an array")
	}
	if len(items) != 4 {
		t.Errorf("items length = %d, want 4", len(items))
	}
}

func TestStructuredLogger_LogEntryParsing(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	logger.
		WithRequestID("req-123").
		WithField("component", "test").
		WithError(io.ErrNoProgress).
		Error("test error message")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	// Verify all expected fields
	expectedFields := map[string]string{
		"request_id": "req-123",
		"component":  "test",
		"error":      io.ErrNoProgress.Error(),
		"message":    "test error message",
		"level":      "error",
	}

	for field, expectedValue := range expectedFields {
		actualValue, ok := entry[field]
		if !ok {
			t.Errorf("Missing field: %s", field)
		} else if actualValue != expectedValue {
			t.Errorf("Field %s = %v, want %v", field, actualValue, expectedValue)
		}
	}
}

func TestLogrusHook_WithStructuredLogger(t *testing.T) {
	logger := NewStructuredLogger()

	hook := test.NewGlobal()
	logrus.AddHook(hook)
	defer logrus.Reset()

	logger.WithField("hooked", true).Info("test message")

	if len(hook.AllEntries()) != 1 {
		t.Fatalf("Expected 1 log entry, got %d", len(hook.AllEntries()))
	}

	entry := hook.AllEntries()[0]
	if entry.Message != "test message" {
		t.Errorf("Message = %v, want 'test message'", entry.Message)
	}

	if entry.Data["hooked"] != true {
		t.Error("hooked field should be true")
	}
}

func TestStructuredLogger_SetOutput(t *testing.T) {
	var buf1, buf2 bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf1)

	logger.Info("message 1")
	if buf1.Len() == 0 {
		t.Error("buf1 should have content")
	}

	logger.SetOutput(&buf2)
	logger.Info("message 2")

	if buf2.Len() == 0 {
		t.Error("buf2 should have content")
	}

	// Verify message 2 is only in buf2
	if strings.Contains(buf1.String(), "message 2") {
		t.Error("message 2 should not be in buf1")
	}
	if !strings.Contains(buf2.String(), "message 2") {
		t.Error("message 2 should be in buf2")
	}
}

func TestStructuredLogger_MultipleFieldTypes(t *testing.T) {
	var buf bytes.Buffer
	logger := NewStructuredLogger()
	logger.SetOutput(&buf)

	logger.
		WithField("int", int(42)).
		WithField("int8", int8(8)).
		WithField("int16", int16(16)).
		WithField("int32", int32(32)).
		WithField("int64", int64(64)).
		WithField("uint", uint(42)).
		WithField("uint8", uint8(8)).
		WithField("uint16", uint16(16)).
		WithField("uint32", uint32(32)).
		WithField("uint64", uint64(64)).
		WithField("float32", float32(3.14)).
		WithField("float64", float64(6.28)).
		Info("numeric types")

	var entry map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse log output: %v", err)
	}

	// All numeric types should be serialized
	expectedNumericTypes := []string{
		"int", "int8", "int16", "int32", "int64",
		"uint", "uint8", "uint16", "uint32", "uint64",
		"float32", "float64",
	}

	for _, field := range expectedNumericTypes {
		if entry[field] == nil {
			t.Errorf("Field %s should be present", field)
		}
	}
}
