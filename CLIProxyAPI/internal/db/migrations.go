// Package db provides database migration management.
package db

import (
	"context"
	"fmt"
	"time"
)

// Migration represents a single database migration.
type Migration struct {
	// Version is the unique migration version identifier.
	Version string
	// Name is a human-readable name for this migration.
	Name string
	// Up is the SQL to apply the migration.
	Up string
	// Down is the SQL to rollback the migration.
	Down string
	// AppliedAt is when this migration was applied (empty if not applied).
	AppliedAt time.Time
}

// MigrationManager handles database migrations.
type MigrationManager struct {
	cluster     *Cluster
	migrations  []*Migration
	schemaTable string
}

// NewMigrationManager creates a new migration manager.
func NewMigrationManager(cluster *Cluster) *MigrationManager {
	schemaTable := cluster.FullTableName("schema_migrations")
	return &MigrationManager{
		cluster:     cluster,
		schemaTable: schemaTable,
	}
}

// RegisterMigration adds a migration to be managed.
func (m *MigrationManager) RegisterMigration(version, name, up, down string) {
	m.migrations = append(m.migrations, &Migration{
		Version: version,
		Name:    name,
		Up:      up,
		Down:    down,
	})
}

// RegisterDefaultMigrations registers all built-in migrations.
func (m *MigrationManager) RegisterDefaultMigrations() {
	// Migration 001: Initial schema
	m.RegisterMigration("001", "initial_schema",
		m.createTablesSQL(),
		m.dropTablesSQL(),
	)

	// Migration 002: Add indexes
	m.RegisterMigration("002", "add_indexes",
		m.createIndexesSQL(),
		"", // Indexes can be dropped by table drop
	)

	// Migration 003: Add usage_stats computed column
	m.RegisterMigration("003", "usage_stats_total_tokens",
		fmt.Sprintf(`
			ALTER TABLE %s ADD COLUMN total_tokens BIGINT GENERATED ALWAYS AS (
				input_tokens + output_tokens + COALESCE(reasoning_tokens, 0) + COALESCE(cached_tokens, 0)
			) STORED;
		`, m.cluster.FullTableName("usage_stats")),
		fmt.Sprintf(`ALTER TABLE %s DROP COLUMN total_tokens`, m.cluster.FullTableName("usage_stats")),
	)
}

// Initialize creates the schema migrations tracking table.
func (m *MigrationManager) Initialize(ctx context.Context) error {
	query := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			version TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`, m.schemaTable)

	_, err := m.cluster.Primary().Exec(ctx, query)
	return err
}

// Pending returns all migrations that have not yet been applied.
func (m *MigrationManager) Pending(ctx context.Context) ([]*Migration, error) {
	if err := m.Initialize(ctx); err != nil {
		return nil, err
	}

	// Get applied versions
	query := fmt.Sprintf(`SELECT version FROM %s ORDER BY version`, m.schemaTable)
	rows, err := m.cluster.Replica().Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		applied[version] = true
	}
	if rows.Err() != nil {
		return nil, rows.Err()
	}

	// Filter pending migrations
	var pending []*Migration
	for _, mig := range m.migrations {
		if !applied[mig.Version] {
			pending = append(pending, mig)
		}
	}

	return pending, nil
}

// Up applies all pending migrations.
func (m *MigrationManager) Up(ctx context.Context) error {
	pending, err := m.Pending(ctx)
	if err != nil {
		return fmt.Errorf("check pending migrations: %w", err)
	}

	if len(pending) == 0 {
		return nil
	}

	// Begin transaction
	tx, err := m.cluster.Primary().Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	for _, mig := range pending {
		// Apply migration
		if _, err := tx.Exec(ctx, mig.Up); err != nil {
			return fmt.Errorf("apply migration %s: %w", mig.Version, err)
		}

		// Record migration
		recordQuery := fmt.Sprintf(`
			INSERT INTO %s (version, name, applied_at)
			VALUES ($1, $2, NOW())
		`, m.schemaTable)

		if _, err := tx.Exec(ctx, recordQuery, mig.Version, mig.Name); err != nil {
			return fmt.Errorf("record migration %s: %w", mig.Version, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit migrations: %w", err)
	}

	return nil
}

// Down rolls back the most recently applied migration.
func (m *MigrationManager) Down(ctx context.Context) error {
	pending, err := m.Pending(ctx)
	if err != nil {
		return fmt.Errorf("check pending migrations: %w", err)
	}

	// Get applied migrations in reverse order
	applied := make([]*Migration, 0)
	for _, mig := range m.migrations {
		found := false
		for _, p := range pending {
			if p.Version == mig.Version {
				found = true
				break
			}
		}
		if !found {
			applied = append(applied, mig)
		}
	}

	if len(applied) == 0 {
		return fmt.Errorf("no migrations to rollback")
	}

	// Rollback the most recent
	last := applied[len(applied)-1]
	if last.Down == "" {
		return fmt.Errorf("migration %s cannot be rolled back", last.Version)
	}

	// Begin transaction
	tx, err := m.cluster.Primary().Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Apply down migration
	if _, err := tx.Exec(ctx, last.Down); err != nil {
		return fmt.Errorf("rollback migration %s: %w", last.Version, err)
	}

	// Remove migration record
	deleteQuery := fmt.Sprintf(`DELETE FROM %s WHERE version = $1`, m.schemaTable)
	if _, err := tx.Exec(ctx, deleteQuery, last.Version); err != nil {
		return fmt.Errorf("delete migration record %s: %w", last.Version, err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit rollback: %w", err)
	}

	return nil
}

// Status returns the current migration status.
func (m *MigrationManager) Status(ctx context.Context) ([]MigrationStatus, error) {
	if err := m.Initialize(ctx); err != nil {
		return nil, err
	}

	// Get applied versions with timestamps
	query := fmt.Sprintf(`SELECT version, name, applied_at FROM %s ORDER BY version`, m.schemaTable)
	rows, err := m.cluster.Replica().Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]MigrationStatus)
	for rows.Next() {
		var version, name string
		var appliedAt time.Time
		if err := rows.Scan(&version, &name, &appliedAt); err != nil {
			return nil, err
		}
		applied[version] = MigrationStatus{
			Version:   version,
			Name:      name,
			AppliedAt: appliedAt,
			Status:    "applied",
		}
	}
	if rows.Err() != nil {
		return nil, rows.Err()
	}

	// Build status list
	var statuses []MigrationStatus
	for _, mig := range m.migrations {
		if status, ok := applied[mig.Version]; ok {
			statuses = append(statuses, status)
		} else {
			statuses = append(statuses, MigrationStatus{
				Version: mig.Version,
				Name:    mig.Name,
				Status:  "pending",
			})
		}
	}

	return statuses, nil
}

// MigrationStatus represents the status of a migration.
type MigrationStatus struct {
	Version   string    `json:"version"`
	Name      string    `json:"name"`
	Status    string    `json:"status"` // "applied" or "pending"
	AppliedAt time.Time `json:"applied_at,omitempty"`
}

func (m *MigrationManager) createTablesSQL() string {
	return fmt.Sprintf(`
		-- OAuth Tokens
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
		);

		-- Usage Stats
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
			success_count BIGINT NOT NULL DEFAULT 0,
			error_count BIGINT NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE (provider, model, auth_id, date)
		);

		-- API Keys
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
		);

		-- Configs
		CREATE TABLE IF NOT EXISTS %s (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name TEXT NOT NULL UNIQUE,
			yaml_config TEXT NOT NULL,
			version INTEGER NOT NULL DEFAULT 1,
			is_active BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		-- Cache
		CREATE TABLE IF NOT EXISTS %s (
			key TEXT PRIMARY KEY,
			value BYTEA NOT NULL,
			expires_at TIMESTAMPTZ NOT NULL,
			content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			tags TEXT[] DEFAULT '{}'
		);

		-- Request Logs
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
		);
	`,
		m.cluster.FullTableName("oauth_tokens"),
		m.cluster.FullTableName("usage_stats"),
		m.cluster.FullTableName("api_keys"),
		m.cluster.FullTableName("configs"),
		m.cluster.FullTableName("cache"),
		m.cluster.FullTableName("request_logs"),
	)
}

func (m *MigrationManager) dropTablesSQL() string {
	return fmt.Sprintf(`
		DROP TABLE IF EXISTS %s CASCADE;
		DROP TABLE IF EXISTS %s CASCADE;
		DROP TABLE IF EXISTS %s CASCADE;
		DROP TABLE IF EXISTS %s CASCADE;
		DROP TABLE IF EXISTS %s CASCADE;
		DROP TABLE IF EXISTS %s CASCADE;
	`,
		m.cluster.FullTableName("request_logs"),
		m.cluster.FullTableName("cache"),
		m.cluster.FullTableName("configs"),
		m.cluster.FullTableName("api_keys"),
		m.cluster.FullTableName("usage_stats"),
		m.cluster.FullTableName("oauth_tokens"),
	)
}

func (m *MigrationManager) createIndexesSQL() string {
	table := func(name string) string {
		return m.cluster.FullTableName(name)
	}

	return fmt.Sprintf(`
		-- OAuth Token Indexes
		CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider_user ON %s (provider, user_id) WHERE deleted_at IS NULL;
		CREATE INDEX IF NOT EXISTS idx_oauth_tokens_active ON %s (is_active) WHERE is_active = true AND deleted_at IS NULL;
		CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON %s (expires_at);
		CREATE INDEX IF NOT EXISTS idx_oauth_tokens_email ON %s (email) WHERE email IS NOT NULL;

		-- Usage Stats Indexes
		CREATE INDEX IF NOT EXISTS idx_usage_stats_provider_model_date ON %s (provider, model, date DESC);
		CREATE INDEX IF NOT EXISTS idx_usage_stats_auth_id ON %s (auth_id, date DESC);
		CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON %s (date DESC);

		-- API Key Indexes
		CREATE INDEX IF NOT EXISTS idx_api_keys_active ON %s (is_active) WHERE is_active = true AND deleted_at IS NULL;
		CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON %s (key_prefix);
		CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON %s (expires_at) WHERE expires_at IS NOT NULL;

		-- Config Indexes
		CREATE INDEX IF NOT EXISTS idx_configs_active ON %s (is_active) WHERE is_active = true;
		CREATE INDEX IF NOT EXISTS idx_configs_name_version ON %s (name, version DESC);

		-- Cache Indexes
		CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON %s (expires_at);
		CREATE INDEX IF NOT EXISTS idx_cache_tags ON %s USING GIN (tags);

		-- Request Log Indexes
		CREATE INDEX IF NOT EXISTS idx_request_logs_request_id ON %s (request_id);
		CREATE INDEX IF NOT EXISTS idx_request_logs_provider_model ON %s (provider, model, created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_request_logs_auth_id ON %s (auth_id, created_at DESC) WHERE auth_id IS NOT NULL;
		CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON %s (created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_request_logs_status_code ON %s (status_code, created_at DESC);
	`,
		table("oauth_tokens"), table("oauth_tokens"), table("oauth_tokens"), table("oauth_tokens"),
		table("usage_stats"), table("usage_stats"), table("usage_stats"),
		table("api_keys"), table("api_keys"), table("api_keys"),
		table("configs"), table("configs"),
		table("cache"), table("cache"),
		table("request_logs"), table("request_logs"), table("request_logs"), table("request_logs"), table("request_logs"),
	)
}

// GetLatestVersion returns the latest applied migration version.
func (m *MigrationManager) GetLatestVersion(ctx context.Context) (string, error) {
	status, err := m.Status(ctx)
	if err != nil {
		return "", err
	}

	for i := len(status) - 1; i >= 0; i-- {
		if status[i].Status == "applied" {
			return status[i].Version, nil
		}
	}

	return "", nil
}
