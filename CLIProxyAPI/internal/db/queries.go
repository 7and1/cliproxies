// Package db provides prepared queries for common database operations.
package db

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// Queries encapsulates prepared SQL statements for efficient database operations.
type Queries struct {
	cluster *Cluster

	// OAuth token queries
	insertOAuthToken         string
	selectOAuthTokenByUser   string
	selectOAuthTokenByID     string
	updateOAuthToken         string
	invalidateOAuthToken     string

	// Usage stats queries
	upsertUsageStats         string
	selectUsageStatsByDate   string
	selectUsageStatsByAuth   string

	// API key queries
	insertAPIKey             string
	selectAPIKeyByHash       string
	selectActiveAPIKeys      string
	updateAPIKeyLastUsed     string

	// Config queries
	insertConfig             string
	selectActiveConfig       string
	selectConfigByName       string
	updateConfigSetActive    string

	// Cache queries
	upsertCache              string
	selectCacheByKey         string
	deleteCacheByKey         string
	deleteCacheByTags        string

	// Request log queries
	insertRequestLog         string
	selectRequestLogsByAuth  string
	selectRequestLogsByDate  string
}

// NewQueries creates a new Queries instance with prepared statement SQL.
func NewQueries(cluster *Cluster) *Queries {
	q := &Queries{cluster: cluster}
	q.initQueries()
	return q
}

func (q *Queries) initQueries() {
	table := func(name string) string {
		return q.cluster.FullTableName(name)
	}

	// OAuth Token Queries
	q.insertOAuthToken = fmt.Sprintf(`
		INSERT INTO %s (id, provider, user_id, email, access_token, refresh_token, token_type, expires_at, scopes, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (provider, user_id)
		DO UPDATE SET access_token = EXCLUDED.access_token,
		              refresh_token = COALESCE(EXCLUDED.refresh_token, %s.refresh_token),
		              expires_at = EXCLUDED.expires_at,
		              updated_at = NOW()
		RETURNING id, created_at, updated_at
	`, table("oauth_tokens"), table("oauth_tokens"))

	q.selectOAuthTokenByUser = fmt.Sprintf(`
		SELECT id, provider, user_id, email, access_token, refresh_token, token_type,
		       expires_at, scopes, metadata, is_active, last_used_at, created_at, updated_at
		FROM %s
		WHERE provider = $1 AND user_id = $2 AND deleted_at IS NULL
		ORDER BY created_at DESC LIMIT 1
	`, table("oauth_tokens"))

	q.selectOAuthTokenByID = fmt.Sprintf(`
		SELECT id, provider, user_id, email, access_token, refresh_token, token_type,
		       expires_at, scopes, metadata, is_active, last_used_at, created_at, updated_at
		FROM %s
		WHERE id = $1 AND deleted_at IS NULL
	`, table("oauth_tokens"))

	q.updateOAuthToken = fmt.Sprintf(`
		UPDATE %s
		SET access_token = $2, refresh_token = $3, expires_at = $4, updated_at = NOW()
		WHERE id = $1
		RETURNING id, updated_at
	`, table("oauth_tokens"))

	q.invalidateOAuthToken = fmt.Sprintf(`
		UPDATE %s
		SET is_active = false, updated_at = NOW()
		WHERE id = $1
	`, table("oauth_tokens"))

	// Usage Stats Queries
	q.upsertUsageStats = fmt.Sprintf(`
		INSERT INTO %s (id, provider, model, auth_id, date, request_count, input_tokens, output_tokens,
		                reasoning_tokens, cached_tokens, success_count, error_count)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (provider, model, auth_id, date)
		DO UPDATE SET request_count = %s.request_count + EXCLUDED.request_count,
		              input_tokens = %s.input_tokens + EXCLUDED.input_tokens,
		              output_tokens = %s.output_tokens + EXCLUDED.output_tokens,
		              reasoning_tokens = COALESCE(%s.reasoning_tokens, 0) + COALESCE(EXCLUDED.reasoning_tokens, 0),
		              cached_tokens = COALESCE(%s.cached_tokens, 0) + COALESCE(EXCLUDED.cached_tokens, 0),
		              success_count = %s.success_count + EXCLUDED.success_count,
		              error_count = %s.error_count + EXCLUDED.error_count,
		              updated_at = NOW()
		RETURNING id, total_tokens
	`, table("usage_stats"), table("usage_stats"), table("usage_stats"), table("usage_stats"),
		table("usage_stats"), table("usage_stats"), table("usage_stats"), table("usage_stats"))

	q.selectUsageStatsByDate = fmt.Sprintf(`
		SELECT provider, model, auth_id, date, request_count, input_tokens, output_tokens,
		       reasoning_tokens, cached_tokens, total_tokens, success_count, error_count
		FROM %s
		WHERE date >= $1 AND date <= $2
		ORDER BY date DESC, provider, model
	`, table("usage_stats"))

	q.selectUsageStatsByAuth = fmt.Sprintf(`
		SELECT provider, model, date, request_count, input_tokens, output_tokens,
		       reasoning_tokens, cached_tokens, total_tokens, success_count, error_count
		FROM %s
		WHERE auth_id = $1 AND date >= $2
		ORDER BY date DESC
	`, table("usage_stats"))

	// API Key Queries
	q.insertAPIKey = fmt.Sprintf(`
		INSERT INTO %s (id, key_hash, key_prefix, name, description, rate_limit, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`, table("api_keys"))

	q.selectAPIKeyByHash = fmt.Sprintf(`
		SELECT id, key_hash, key_prefix, name, description, rate_limit, is_active, expires_at, last_used_at, created_at
		FROM %s
		WHERE key_hash = $1 AND is_active = true AND deleted_at IS NULL
	`, table("api_keys"))

	q.selectActiveAPIKeys = fmt.Sprintf(`
		SELECT id, key_hash, key_prefix, name, description, rate_limit, expires_at, created_at
		FROM %s
		WHERE is_active = true AND deleted_at IS NULL
		ORDER BY created_at DESC
	`, table("api_keys"))

	q.updateAPIKeyLastUsed = fmt.Sprintf(`
		UPDATE %s
		SET last_used_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`, table("api_keys"))

	// Config Queries
	q.insertConfig = fmt.Sprintf(`
		INSERT INTO %s (id, name, yaml_config, version, is_active)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (name)
		DO UPDATE SET yaml_config = EXCLUDED.yaml_config,
		              version = %s.version + 1,
		              is_active = EXCLUDED.is_active,
		              updated_at = NOW()
		RETURNING id, version, updated_at
	`, table("configs"), table("configs"))

	q.selectActiveConfig = fmt.Sprintf(`
		SELECT id, name, yaml_config, version, is_active, created_at, updated_at
		FROM %s
		WHERE is_active = true
		ORDER BY version DESC
		LIMIT 1
	`, table("configs"))

	q.selectConfigByName = fmt.Sprintf(`
		SELECT id, name, yaml_config, version, is_active, created_at, updated_at
		FROM %s
		WHERE name = $1
		ORDER BY version DESC
		LIMIT 1
	`, table("configs"))

	q.updateConfigSetActive = fmt.Sprintf(`
		UPDATE %s
		SET is_active = CASE WHEN id = $1 THEN true ELSE false END,
		    updated_at = NOW()
		WHERE name = (SELECT name FROM %s WHERE id = $1)
	`, table("configs"), table("configs"))

	// Cache Queries
	q.upsertCache = fmt.Sprintf(`
		INSERT INTO %s (key, value, expires_at, content_type, tags)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (key)
		DO UPDATE SET value = EXCLUDED.value,
		              expires_at = EXCLUDED.expires_at,
		              content_type = EXCLUDED.content_type,
		              tags = EXCLUDED.tags,
		              created_at = NOW()
	`, table("cache"))

	q.selectCacheByKey = fmt.Sprintf(`
		SELECT key, value, expires_at, content_type, tags, created_at
		FROM %s
		WHERE key = $1 AND expires_at > NOW()
	`, table("cache"))

	q.deleteCacheByKey = fmt.Sprintf(`
		DELETE FROM %s WHERE key = $1
	`, table("cache"))

	q.deleteCacheByTags = fmt.Sprintf(`
		DELETE FROM %s WHERE $2 = ANY(tags)
	`, table("cache"))

	// Request Log Queries
	q.insertRequestLog = fmt.Sprintf(`
		INSERT INTO %s (id, request_id, provider, model, auth_id, api_key_hash,
		                client_ip, user_agent, method, path, status_code, latency_ms,
		                input_tokens, output_tokens, error_message)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`, table("request_logs"))

	q.selectRequestLogsByAuth = fmt.Sprintf(`
		SELECT request_id, provider, model, auth_id, status_code, latency_ms,
		       input_tokens, output_tokens, error_message, created_at
		FROM %s
		WHERE auth_id = $1 AND created_at >= $2
		ORDER BY created_at DESC
		LIMIT $3
	`, table("request_logs"))

	q.selectRequestLogsByDate = fmt.Sprintf(`
		SELECT provider, model, COUNT(*) as request_count,
		       AVG(latency_ms) as avg_latency,
		       SUM(input_tokens) as total_input_tokens,
		       SUM(output_tokens) as total_output_tokens,
		       SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
		FROM %s
		WHERE created_at >= $1 AND created_at < $2
		GROUP BY provider, model
		ORDER BY request_count DESC
	`, table("request_logs"))
}

// OAuthToken Operations

// InsertOAuthToken inserts or updates an OAuth token.
func (q *Queries) InsertOAuthToken(ctx context.Context, token *OAuthToken) error {
	metadataJSON, _ := json.Marshal(token.Metadata)
	scopes := token.Scopes
	if scopes == nil {
		scopes = []string{}
	}

	var createdAt, updatedAt time.Time
	err := q.cluster.Primary().QueryRow(ctx, q.insertOAuthToken,
		token.ID, token.Provider, token.UserID, token.Email,
		token.AccessToken, token.RefreshToken, token.TokenType,
		token.ExpiresAt, scopes, metadataJSON,
	).Scan(&token.ID, &createdAt, &updatedAt)

	if err != nil {
		return fmt.Errorf("insert oauth token: %w", err)
	}

	token.CreatedAt = createdAt
	token.UpdatedAt = updatedAt
	return nil
}

// SelectOAuthTokenByUser retrieves the most recent active token for a provider/user.
func (q *Queries) SelectOAuthTokenByUser(ctx context.Context, provider, userID string) (*OAuthToken, error) {
	var token OAuthToken
	var metadataJSON []byte
	var scopes []string

	err := q.cluster.Replica().QueryRow(ctx, q.selectOAuthTokenByUser, provider, userID).Scan(
		&token.ID, &token.Provider, &token.UserID, &token.Email,
		&token.AccessToken, &token.RefreshToken, &token.TokenType,
		&token.ExpiresAt, &scopes, &metadataJSON, &token.IsActive,
		&token.LastUsedAt, &token.CreatedAt, &token.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("oauth token not found")
	}
	if err != nil {
		return nil, fmt.Errorf("select oauth token: %w", err)
	}

	token.Scopes = scopes
	if len(metadataJSON) > 0 {
		json.Unmarshal(metadataJSON, &token.Metadata)
	}

	return &token, nil
}

// SelectOAuthTokenByID retrieves a token by its ID.
func (q *Queries) SelectOAuthTokenByID(ctx context.Context, id string) (*OAuthToken, error) {
	var token OAuthToken
	var metadataJSON []byte
	var scopes []string

	err := q.cluster.Replica().QueryRow(ctx, q.selectOAuthTokenByID, id).Scan(
		&token.ID, &token.Provider, &token.UserID, &token.Email,
		&token.AccessToken, &token.RefreshToken, &token.TokenType,
		&token.ExpiresAt, &scopes, &metadataJSON, &token.IsActive,
		&token.LastUsedAt, &token.CreatedAt, &token.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("oauth token not found")
	}
	if err != nil {
		return nil, fmt.Errorf("select oauth token: %w", err)
	}

	token.Scopes = scopes
	if len(metadataJSON) > 0 {
		json.Unmarshal(metadataJSON, &token.Metadata)
	}

	return &token, nil
}

// UsageStats Operations

// UpsertUsageStats inserts or updates usage statistics for a day.
func (q *Queries) UpsertUsageStats(ctx context.Context, stats *UsageStats) error {
	var id string
	var totalTokens int64
	var createdAt, updatedAt time.Time

	err := q.cluster.Primary().QueryRow(ctx, q.upsertUsageStats,
		stats.Provider, stats.Model, stats.AuthID, stats.Date,
		stats.RequestCount, stats.InputTokens, stats.OutputTokens,
		stats.ReasoningTokens, stats.CachedTokens,
		stats.SuccessCount, stats.ErrorCount,
	).Scan(&id, &totalTokens, &createdAt, &updatedAt)

	if err != nil {
		return fmt.Errorf("upsert usage stats: %w", err)
	}

	stats.ID = id
	stats.TotalTokens = totalTokens
	stats.CreatedAt = createdAt
	stats.UpdatedAt = updatedAt
	return nil
}

// APIKey Operations

// InsertAPIKey inserts a new API key.
func (q *Queries) InsertAPIKey(ctx context.Context, key *APIKey, plaintextKey string) error {
	hash := sha256.Sum256([]byte(plaintextKey))
	key.KeyHash = hex.EncodeToString(hash[:])
	key.KeyPrefix = plaintextKey
	if len(key.KeyPrefix) > 8 {
		key.KeyPrefix = key.KeyPrefix[:8]
	}

	if key.ID == "" {
		key.ID = uuid.New().String()
	}

	var createdAt time.Time
	err := q.cluster.Primary().QueryRow(ctx, q.insertAPIKey,
		key.ID, key.KeyHash, key.KeyPrefix, key.Name,
		key.Description, key.RateLimit, key.ExpiresAt,
	).Scan(&key.ID, &createdAt)

	if err != nil {
		return fmt.Errorf("insert api key: %w", err)
	}

	key.CreatedAt = createdAt
	key.UpdatedAt = createdAt
	return nil
}

// SelectAPIKeyByHash retrieves an API key by its hash.
func (q *Queries) SelectAPIKeyByHash(ctx context.Context, hash string) (*APIKey, error) {
	var key APIKey
	err := q.cluster.Replica().QueryRow(ctx, q.selectAPIKeyByHash, hash).Scan(
		&key.ID, &key.KeyHash, &key.KeyPrefix, &key.Name,
		&key.Description, &key.RateLimit, &key.IsActive,
		&key.ExpiresAt, &key.LastUsedAt, &key.CreatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("api key not found")
	}
	if err != nil {
		return nil, fmt.Errorf("select api key: %w", err)
	}

	return &key, nil
}

// ValidateAPIKey validates a plaintext API key.
func (q *Queries) ValidateAPIKey(ctx context.Context, plaintextKey string) (*APIKey, error) {
	hash := sha256.Sum256([]byte(plaintextKey))
	hashStr := hex.EncodeToString(hash[:])

	key, err := q.SelectAPIKeyByHash(ctx, hashStr)
	if err != nil {
		return nil, err
	}

	// Check expiration
	if key.ExpiresAt != nil && key.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("api key expired")
	}

	// Update last used timestamp
	go func() {
		_ = q.UpdateAPIKeyLastUsed(context.Background(), key.ID)
	}()

	return key, nil
}

// UpdateAPIKeyLastUsed updates the last_used_at timestamp.
func (q *Queries) UpdateAPIKeyLastUsed(ctx context.Context, id string) error {
	_, err := q.cluster.Primary().Exec(ctx, q.updateAPIKeyLastUsed, id)
	return err
}

// Cache Operations

// SetCache stores a value in the cache.
func (q *Queries) SetCache(ctx context.Context, key string, value []byte, ttl time.Duration, contentType string, tags []string) error {
	expiresAt := time.Now().Add(ttl)
	if ttl <= 0 {
		expiresAt = time.Now().Add(24 * time.Hour) // Default 24h
	}

	_, err := q.cluster.Primary().Exec(ctx, q.upsertCache, key, value, expiresAt, contentType, tags)
	return err
}

// GetCache retrieves a value from the cache.
func (q *Queries) GetCache(ctx context.Context, key string) ([]byte, error) {
	var value []byte
	var expiresAt time.Time

	err := q.cluster.Replica().QueryRow(ctx, q.selectCacheByKey, key).Scan(
		&value, &expiresAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("cache miss")
	}
	if err != nil {
		return nil, fmt.Errorf("get cache: %w", err)
	}

	return value, nil
}

// DeleteCache removes a value from the cache.
func (q *Queries) DeleteCache(ctx context.Context, key string) error {
	_, err := q.cluster.Primary().Exec(ctx, q.deleteCacheByKey, key)
	return err
}

// InvalidateCacheByTag removes all cache entries with a specific tag.
func (q *Queries) InvalidateCacheByTag(ctx context.Context, tag string) error {
	_, err := q.cluster.Primary().Exec(ctx, q.deleteCacheByTags, tag)
	return err
}

// RequestLog Operations

// InsertRequestLog logs a request.
func (q *Queries) InsertRequestLog(ctx context.Context, log *RequestLog) error {
	if log.ID == "" {
		log.ID = uuid.New().String()
	}

	_, err := q.cluster.Primary().Exec(ctx, q.insertRequestLog,
		log.ID, log.RequestID, log.Provider, log.Model, log.AuthID, log.APIKeyHash,
		log.ClientIP, log.UserAgent, log.Method, log.Path,
		log.StatusCode, log.LatencyMs, log.InputTokens, log.OutputTokens, log.ErrorMessage,
	)

	return err
}

// Config Operations

// UpsertConfig inserts or updates a configuration.
func (q *Queries) UpsertConfig(ctx context.Context, config *Config) error {
	if config.ID == "" {
		config.ID = uuid.New().String()
	}

	var createdAt, updatedAt time.Time
	err := q.cluster.Primary().QueryRow(ctx, q.insertConfig,
		config.ID, config.Name, config.YAMLConfig,
		config.Version, config.IsActive,
	).Scan(&config.ID, &config.Version, &createdAt, &updatedAt)

	if err != nil {
		return fmt.Errorf("upsert config: %w", err)
	}

	config.CreatedAt = createdAt
	config.UpdatedAt = updatedAt
	return nil
}

// GetActiveConfig retrieves the currently active configuration.
func (q *Queries) GetActiveConfig(ctx context.Context) (*Config, error) {
	var config Config
	err := q.cluster.Replica().QueryRow(ctx, q.selectActiveConfig).Scan(
		&config.ID, &config.Name, &config.YAMLConfig,
		&config.Version, &config.IsActive, &config.CreatedAt, &config.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("no active config")
	}
	if err != nil {
		return nil, fmt.Errorf("get active config: %w", err)
	}

	return &config, nil
}

// SetActiveConfig sets a configuration as active (deactivates others).
func (q *Queries) SetActiveConfig(ctx context.Context, configID string) error {
	_, err := q.cluster.Primary().Exec(ctx, q.updateConfigSetActive, configID)
	return err
}
