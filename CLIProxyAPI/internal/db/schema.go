// Package db provides schema management for CLIProxyAPI database.
package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// SchemaManager handles database schema creation and migrations.
type SchemaManager struct {
	cluster *Cluster
}

// NewSchemaManager creates a new schema manager.
func NewSchemaManager(cluster *Cluster) *SchemaManager {
	return &SchemaManager{cluster: cluster}
}

// CreateSchema creates all required database tables with proper indexes.
func (sm *SchemaManager) CreateSchema(ctx context.Context) error {
	if err := sm.createOAuthTokensTable(ctx); err != nil {
		return fmt.Errorf("create oauth_tokens table: %w", err)
	}
	if err := sm.createUsageStatsTable(ctx); err != nil {
		return fmt.Errorf("create usage_stats table: %w", err)
	}
	if err := sm.createAPIKeysTable(ctx); err != nil {
		return fmt.Errorf("create api_keys table: %w", err)
	}
	if err := sm.createConfigsTable(ctx); err != nil {
		return fmt.Errorf("create configs table: %w", err)
	}
	if err := sm.createCacheTable(ctx); err != nil {
		return fmt.Errorf("create cache table: %w", err)
	}
	if err := sm.createRequestLogsTable(ctx); err != nil {
		return fmt.Errorf("create request_logs table: %w", err)
	}
	return nil
}

func (sm *SchemaManager) createOAuthTokensTable(ctx context.Context) error {
	table := sm.cluster.FullTableName("oauth_tokens")
	query := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			provider TEXT NOT NULL CHECK (provider IN ('claude', 'gemini', 'codex', 'qwen', 'iflow', 'antigravity')),
			user_id TEXT NOT NULL,
			email TEXT,
			access_token TEXT NOT NULL,
			refresh_token TEXT,
			token_type TEXT NOT NULL DEFAULT 'Bearer',
			expires_at TIMESTAMPTZ NOT NULL,
			scopes TEXT[] DEFAULT '{}',
			metadata JSONB DEFAULT '{}',
			is_active BOOLEAN NOT NULL DEFAULT true,
			last_used_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			deleted_at TIMESTAMPTZ
		)
	`, table)

	if _, err := sm.cluster.Primary().Exec(ctx, query); err != nil {
		return err
	}

	// Create indexes for common queries
	indexes := []string{
		// Index for active token lookups by provider and user
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider_user ON %s (provider, user_id) WHERE deleted_at IS NULL`, table),
		// Index for finding active tokens
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_oauth_tokens_active ON %s (is_active) WHERE is_active = true AND deleted_at IS NULL`, table),
		// Index for expiration cleanup
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON %s (expires_at)`, table),
		// Index for email lookups
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_oauth_tokens_email ON %s (email) WHERE email IS NOT NULL`, table),
		// Partial index for soft deletes
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_oauth_tokens_deleted ON %s (deleted_at) WHERE deleted_at IS NOT NULL`, table),
	}

	for _, idx := range indexes {
		if _, err := sm.cluster.Primary().Exec(ctx, idx); err != nil {
			return err
		}
	}

	return nil
}

func (sm *SchemaManager) createUsageStatsTable(ctx context.Context) error {
	table := sm.cluster.FullTableName("usage_stats")
	query := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			provider TEXT NOT NULL,
			model TEXT NOT NULL,
			auth_id TEXT NOT NULL,
			date DATE NOT NULL,
			request_count BIGINT NOT NULL DEFAULT 0,
			input_tokens BIGINT NOT NULL DEFAULT 0,
			output_tokens BIGINT NOT NULL DEFAULT 0,
			reasoning_tokens BIGINT NOT NULL DEFAULT 0,
			cached_tokens BIGINT NOT NULL DEFAULT 0,
			total_tokens BIGINT NOT NULL DEFAULT 0 GENERATED ALWAYS AS (
				input_tokens + output_tokens + COALESCE(reasoning_tokens, 0) + COALESCE(cached_tokens, 0)
			) STORED,
			success_count BIGINT NOT NULL DEFAULT 0,
			error_count BIGINT NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (provider, model, auth_id, date)
		)
	`, table)

	if _, err := sm.cluster.Primary().Exec(ctx, query); err != nil {
		return err
	}

	// Create indexes for analytics queries
	indexes := []string{
		// Index for daily stats by provider/model
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_usage_stats_provider_model_date ON %s (provider, model, date DESC)`, table),
		// Index for auth-specific stats
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_usage_stats_auth_id ON %s (auth_id, date DESC)`, table),
		// Index for date range queries
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON %s (date DESC)`, table),
		// Partial index for non-zero usage
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_usage_stats_nonzero ON %s (date) WHERE request_count > 0`, table),
	}

	for _, idx := range indexes {
		if _, err := sm.cluster.Primary().Exec(ctx, idx); err != nil {
			return err
		}
	}

	return nil
}

func (sm *SchemaManager) createAPIKeysTable(ctx context.Context) error {
	table := sm.cluster.FullTableName("api_keys")
	query := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			key_hash TEXT NOT NULL UNIQUE,
			key_prefix TEXT NOT NULL,
			name TEXT,
			description TEXT,
			rate_limit INTEGER NOT NULL DEFAULT 0 CHECK (rate_limit >= 0),
			is_active BOOLEAN NOT NULL DEFAULT true,
			expires_at TIMESTAMPTZ,
			last_used_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			deleted_at TIMESTAMPTZ
		)
	`, table)

	if _, err := sm.cluster.Primary().Exec(ctx, query); err != nil {
		return err
	}

	// Create indexes
	indexes := []string{
		// Unique index on key_hash is already in table definition
		// Index for active keys lookup
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_api_keys_active ON %s (is_active) WHERE is_active = true AND deleted_at IS NULL`, table),
		// Index for prefix-based lookups
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON %s (key_prefix)`, table),
		// Index for expiration cleanup
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON %s (expires_at) WHERE expires_at IS NOT NULL`, table),
		// Partial index for soft deletes
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_api_keys_deleted ON %s (deleted_at) WHERE deleted_at IS NOT NULL`, table),
	}

	for _, idx := range indexes {
		if _, err := sm.cluster.Primary().Exec(ctx, idx); err != nil {
			return err
		}
	}

	return nil
}

func (sm *SchemaManager) createConfigsTable(ctx context.Context) error {
	table := sm.cluster.FullTableName("configs")
	query := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name TEXT NOT NULL UNIQUE,
			yaml_config TEXT NOT NULL,
			version INTEGER NOT NULL DEFAULT 1,
			is_active BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`, table)

	if _, err := sm.cluster.Primary().Exec(ctx, query); err != nil {
		return err
	}

	// Create indexes
	indexes := []string{
		// Unique index on name is already in table definition
		// Index for finding active config
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_configs_active ON %s (is_active) WHERE is_active = true`, table),
		// Index for version queries
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_configs_name_version ON %s (name, version DESC)`, table),
	}

	for _, idx := range indexes {
		if _, err := sm.cluster.Primary().Exec(ctx, idx); err != nil {
			return err
		}
	}

	return nil
}

func (sm *SchemaManager) createCacheTable(ctx context.Context) error {
	table := sm.cluster.FullTableName("cache")
	query := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			key TEXT PRIMARY KEY,
			value BYTEA NOT NULL,
			expires_at TIMESTAMPTZ NOT NULL,
			content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			tags TEXT[] DEFAULT '{}'
		)
	`, table)

	if _, err := sm.cluster.Primary().Exec(ctx, query); err != nil {
		return err
	}

	// Create indexes
	indexes := []string{
		// Index for expiration cleanup and lookup
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON %s (expires_at)`, table),
		// Index for tag-based invalidation
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_cache_tags ON %s USING GIN (tags)`, table),
		// Partial index for non-expired entries
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_cache_valid ON %s (expires_at) WHERE expires_at > NOW()`, table),
	}

	for _, idx := range indexes {
		if _, err := sm.cluster.Primary().Exec(ctx, idx); err != nil {
			return err
		}
	}

	return nil
}

func (sm *SchemaManager) createRequestLogsTable(ctx context.Context) error {
	table := sm.cluster.FullTableName("request_logs")
	query := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			request_id TEXT NOT NULL UNIQUE,
			provider TEXT NOT NULL,
			model TEXT NOT NULL,
			auth_id TEXT,
			api_key_hash TEXT,
			client_ip TEXT NOT NULL,
			user_agent TEXT,
			method TEXT NOT NULL,
			path TEXT NOT NULL,
			status_code INTEGER NOT NULL,
			latency_ms BIGINT NOT NULL,
			input_tokens INTEGER,
			output_tokens INTEGER,
			error_message TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`, table)

	if _, err := sm.cluster.Primary().Exec(ctx, query); err != nil {
		return err
	}

	// Create indexes for log queries
	indexes := []string{
		// Index for request_id lookups
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_request_logs_request_id ON %s (request_id)`, table),
		// Index for provider/model analytics
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_request_logs_provider_model ON %s (provider, model, created_at DESC)`, table),
		// Index for auth-based queries
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_request_logs_auth_id ON %s (auth_id, created_at DESC) WHERE auth_id IS NOT NULL`, table),
		// Index for time-series queries
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON %s (created_at DESC)`, table),
		// Index for status code filtering
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_request_logs_status_code ON %s (status_code, created_at DESC)`, table),
		// Index for error tracking
		fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_request_logs_errors ON %s (created_at DESC) WHERE status_code >= 400`, table),
	}

	for _, idx := range indexes {
		if _, err := sm.cluster.Primary().Exec(ctx, idx); err != nil {
			return err
		}
	}

	return nil
}

// CleanupExpiredEntries removes expired cache entries and inactive OAuth tokens.
func (sm *SchemaManager) CleanupExpiredEntries(ctx context.Context) (int64, error) {
	// Clean expired cache entries
	cacheTable := sm.cluster.FullTableName("cache")
	cacheResult, err := sm.cluster.Primary().Exec(ctx, fmt.Sprintf(
		`DELETE FROM %s WHERE expires_at < NOW()`, cacheTable,
	))
	if err != nil {
		return 0, fmt.Errorf("cleanup cache: %w", err)
	}

	cacheRows := cacheResult.RowsAffected()

	// Clean expired OAuth tokens (mark as inactive)
	tokensTable := sm.cluster.FullTableName("oauth_tokens")
	tokensResult, err := sm.cluster.Primary().Exec(ctx, fmt.Sprintf(
		`UPDATE %s SET is_active = false, updated_at = NOW() WHERE expires_at < NOW() AND is_active = true`, tokensTable,
	))
	if err != nil {
		return cacheRows, fmt.Errorf("cleanup tokens: %w", err)
	}

	return cacheRows + tokensResult.RowsAffected(), nil
}

// VacuumAndAnalyze runs VACUUM ANALYZE on all tables to reclaim space and update statistics.
func (sm *SchemaManager) VacuumAndAnalyze(ctx context.Context) error {
	tables := []string{"oauth_tokens", "usage_stats", "api_keys", "configs", "cache", "request_logs"}

	for _, table := range tables {
		fullName := sm.cluster.FullTableName(table)
		if _, err := sm.cluster.Primary().Exec(ctx, fmt.Sprintf(`VACUUM ANALYZE %s`, fullName)); err != nil {
			// Log but don't fail - VACUUM may be blocked by other transactions
			if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "25006" {
				// ERROR: cannot run VACUUM in a transaction
				continue
			}
			return fmt.Errorf("vacuum %s: %w", table, err)
		}
	}

	return nil
}

// GetTableStats returns statistics about all tables.
func (sm *SchemaManager) GetTableStats(ctx context.Context) (map[string]TableStats, error) {
	tables := []string{"oauth_tokens", "usage_stats", "api_keys", "configs", "cache", "request_logs"}
	stats := make(map[string]TableStats)

	for _, tableName := range tables {
		fullName := sm.cluster.FullTableName(tableName)
		var stat TableStats

		// Get row count
		if err := sm.cluster.Replica().QueryRow(ctx, fmt.Sprintf(
			`SELECT COUNT(*) FROM %s`, fullName,
		)).Scan(&stat.RowCount); err != nil {
			if err == pgx.ErrNoRows {
				stat.RowCount = 0
			} else {
				return nil, fmt.Errorf("count rows in %s: %w", tableName, err)
			}
		}

		// Get table size
		if err := sm.cluster.Replica().QueryRow(ctx, fmt.Sprintf(
			`SELECT pg_total_relation_size(%s::regclass)`, fullName,
		)).Scan(&stat.SizeBytes); err != nil && err != pgx.ErrNoRows {
			return nil, fmt.Errorf("get size of %s: %w", tableName, err)
		}

		stats[tableName] = stat
	}

	return stats, nil
}

// TableStats contains statistics about a database table.
type TableStats struct {
	RowCount  int64 `json:"row_count"`
	SizeBytes int64 `json:"size_bytes"`
}

// CreateTablePartitioning creates date-based partitions for request_logs (optional optimization).
func (sm *SchemaManager) CreateTablePartitioning(ctx context.Context) error {
	// This is an advanced optimization - partition by month
	// Only run this if you have high volume
	// Requires manual migration due to table recreation needs
	return fmt.Errorf("table partitioning requires manual migration")
}
