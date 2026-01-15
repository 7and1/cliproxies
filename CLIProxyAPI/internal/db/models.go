// Package db provides data models for database entities.
package db

import (
	"time"
)

// OAuthToken represents an OAuth token stored in the database.
type OAuthToken struct {
	// ID is the primary key (UUID).
	ID string `json:"id"`
	// Provider is the OAuth provider (e.g., "claude", "gemini", "codex").
	Provider string `json:"provider"`
	// UserID is the user identifier from the provider.
	UserID string `json:"user_id"`
	// Email is the user's email (optional).
	Email string `json:"email,omitempty"`
	// AccessToken is the OAuth access token (encrypted).
	AccessToken string `json:"access_token"`
	// RefreshToken is the OAuth refresh token (encrypted).
	RefreshToken string `json:"refresh_token,omitempty"`
	// TokenType is the token type (usually "Bearer").
	TokenType string `json:"token_type"`
	// ExpiresAt is when the access token expires.
	ExpiresAt time.Time `json:"expires_at"`
	// Scopes granted for this token.
	Scopes []string `json:"scopes,omitempty"`
	// Metadata contains additional provider-specific data as JSONB.
	Metadata map[string]any `json:"metadata,omitempty"`
	// IsActive indicates if the token is currently active.
	IsActive bool `json:"is_active"`
	// LastUsedAt tracks the last time this token was used.
	LastUsedAt time.Time `json:"last_used_at"`
	// CreatedAt is the creation timestamp.
	CreatedAt time.Time `json:"created_at"`
	// UpdatedAt is the last modification timestamp.
	UpdatedAt time.Time `json:"updated_at"`
	// DeletedAt supports soft delete (null if not deleted).
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

// TableName returns the table name for OAuthToken.
func (OAuthToken) TableName() string {
	return "oauth_tokens"
}

// UsageStats represents aggregated usage statistics.
type UsageStats struct {
	// ID is the primary key (UUID).
	ID string `json:"id"`
	// Provider is the AI provider (e.g., "claude", "gemini").
	Provider string `json:"provider"`
	// Model is the model identifier (e.g., "claude-sonnet-4").
	Model string `json:"model"`
	// AuthID references the OAuth token or API key used.
	AuthID string `json:"auth_id"`
	// Date is the aggregation date (truncated to day).
	Date time.Time `json:"date"`
	// RequestCount is the number of requests made.
	RequestCount int64 `json:"request_count"`
	// InputTokens is the total input tokens used.
	InputTokens int64 `json:"input_tokens"`
	// OutputTokens is the total output tokens generated.
	OutputTokens int64 `json:"output_tokens"`
	// ReasoningTokens is the total reasoning tokens used.
	ReasoningTokens int64 `json:"reasoning_tokens,omitempty"`
	// CachedTokens is the total cached tokens used.
	CachedTokens int64 `json:"cached_tokens,omitempty"`
	// TotalTokens is the sum of all token types.
	TotalTokens int64 `json:"total_tokens"`
	// SuccessCount is the number of successful requests.
	SuccessCount int64 `json:"success_count"`
	// ErrorCount is the number of failed requests.
	ErrorCount int64 `json:"error_count"`
	// CreatedAt is the creation timestamp.
	CreatedAt time.Time `json:"created_at"`
	// UpdatedAt is the last modification timestamp.
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName returns the table name for UsageStats.
func (UsageStats) TableName() string {
	return "usage_stats"
}

// APIKey represents an API key stored in the database.
type APIKey struct {
	// ID is the primary key (UUID).
	ID string `json:"id"`
	// KeyHash is the SHA-256 hash of the API key.
	KeyHash string `json:"key_hash"`
	// KeyPrefix is the first 8 characters of the key for identification.
	KeyPrefix string `json:"key_prefix"`
	// Name is a human-readable name for the key.
	Name string `json:"name,omitempty"`
	// Description is an optional description.
	Description string `json:"description,omitempty"`
	// RateLimit is the requests per minute limit (0 = unlimited).
	RateLimit int32 `json:"rate_limit"`
	// IsActive indicates if the key is currently active.
	IsActive bool `json:"is_active"`
	// ExpiresAt is when the key expires (optional).
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	// LastUsedAt tracks the last time this key was used.
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	// CreatedAt is the creation timestamp.
	CreatedAt time.Time `json:"created_at"`
	// UpdatedAt is the last modification timestamp.
	UpdatedAt time.Time `json:"updated_at"`
	// DeletedAt supports soft delete (null if not deleted).
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

// TableName returns the table name for APIKey.
func (APIKey) TableName() string {
	return "api_keys"
}

// Config represents a configuration version stored in the database.
type Config struct {
	// ID is the primary key (UUID).
	ID string `json:"id"`
	// Name is a unique name for this config.
	Name string `json:"name"`
	// YAMLConfig is the full YAML configuration.
	YAMLConfig string `json:"yaml_config"`
	// Version is the config version number.
	Version int32 `json:"version"`
	// IsActive indicates if this is the currently active config.
	IsActive bool `json:"is_active"`
	// CreatedAt is the creation timestamp.
	CreatedAt time.Time `json:"created_at"`
	// UpdatedAt is the last modification timestamp.
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName returns the table name for Config.
func (Config) TableName() string {
	return "configs"
}

// CacheEntry represents a cached value with expiration.
type CacheEntry struct {
	// Key is the cache key (primary key).
	Key string `json:"key"`
	// Value is the cached data (can be JSON or binary).
	Value []byte `json:"value"`
	// ExpiresAt is when this cache entry expires.
	ExpiresAt time.Time `json:"expires_at"`
	// ContentType indicates the content type (e.g., "application/json").
	ContentType string `json:"content_type"`
	// CreatedAt is the creation timestamp.
	CreatedAt time.Time `json:"created_at"`
	// Tags are optional tags for cache invalidation.
	Tags []string `json:"tags,omitempty"`
}

// TableName returns the table name for CacheEntry.
func (CacheEntry) TableName() string {
	return "cache"
}

// RequestLog represents an API request log entry.
type RequestLog struct {
	// ID is the primary key (UUID).
	ID string `json:"id"`
	// RequestID is the unique request identifier.
	RequestID string `json:"request_id"`
	// Provider is the AI provider used.
	Provider string `json:"provider"`
	// Model is the model requested.
	Model string `json:"model"`
	// AuthID references the authentication used.
	AuthID string `json:"auth_id"`
	// APIKeyHash is the hash of the API key used (if applicable).
	APIKeyHash string `json:"api_key_hash,omitempty"`
	// ClientIP is the client's IP address.
	ClientIP string `json:"client_ip"`
	// UserAgent is the client's user agent.
	UserAgent string `json:"user_agent,omitempty"`
	// Method is the HTTP method (e.g., "POST").
	Method string `json:"method"`
	// Path is the request path.
	Path string `json:"path"`
	// StatusCode is the HTTP response status code.
	StatusCode int32 `json:"status_code"`
	// LatencyMs is the request latency in milliseconds.
	LatencyMs int64 `json:"latency_ms"`
	// InputTokens is the number of input tokens.
	InputTokens int32 `json:"input_tokens,omitempty"`
	// OutputTokens is the number of output tokens.
	OutputTokens int32 `json:"output_tokens,omitempty"`
	// ErrorMessage is set if the request failed.
	ErrorMessage string `json:"error_message,omitempty"`
	// CreatedAt is the creation timestamp.
	CreatedAt time.Time `json:"created_at"`
}

// TableName returns the table name for RequestLog.
func (RequestLog) TableName() string {
	return "request_logs"
}
