// Package db provides connection pooling and database cluster management for CLIProxyAPI.
// It uses pgxpool for efficient connection management and supports read replicas.
package db

import (
	"context"
	"fmt"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PoolConfig captures connection pool configuration.
type PoolConfig struct {
	// MaxConns is the maximum number of connections in the pool. Default: 20.
	MaxConns int32
	// MinConns is the minimum number of connections in the pool. Default: 5.
	MinConns int32
	// MaxConnLifetime is the maximum lifetime of a connection. Default: 1 hour.
	MaxConnLifetime time.Duration
	// MaxConnIdleTime is the maximum idle time of a connection. Default: 30 minutes.
	MaxConnIdleTime time.Duration
	// HealthCheckPeriod is how often to check connection health. Default: 1 minute.
	HealthCheckPeriod time.Duration
}

// DefaultPoolConfig returns sensible defaults for connection pooling.
func DefaultPoolConfig() PoolConfig {
	return PoolConfig{
		MaxConns:          20,
		MinConns:          5,
		MaxConnLifetime:   time.Hour,
		MaxConnIdleTime:   30 * time.Minute,
		HealthCheckPeriod: time.Minute,
	}
}

// ClusterConfig defines primary and replica database endpoints.
type ClusterConfig struct {
	// Primary is the primary (write) database DSN.
	Primary string
	// Replicas are read-only replica DSNs. Load balanced in round-robin.
	Replicas []string
	// Pool is the connection pool configuration.
	Pool PoolConfig
	// Schema is the optional schema prefix for all tables.
	Schema string
}

// Cluster manages a primary database connection pool and optional read replicas.
type Cluster struct {
	primary *pgxpool.Pool
	replicas []*pgxpool.Pool
	rrIndex  uint32
	cfg      ClusterConfig
}

// NewCluster creates a new database cluster with primary and optional replicas.
func NewCluster(ctx context.Context, cfg ClusterConfig) (*Cluster, error) {
	if cfg.Primary == "" {
		return nil, fmt.Errorf("db: primary DSN is required")
	}

	poolCfg := cfg.Pool
	if poolCfg.MaxConns == 0 {
		poolCfg = DefaultPoolConfig()
	}

	// Parse and configure primary pool
	primaryConfig, err := pgxpool.ParseConfig(cfg.Primary)
	if err != nil {
		return nil, fmt.Errorf("db: parse primary DSN: %w", err)
	}
	applyPoolConfig(primaryConfig, poolCfg)

	primary, err := pgxpool.NewWithConfig(ctx, primaryConfig)
	if err != nil {
		return nil, fmt.Errorf("db: create primary pool: %w", err)
	}

	cluster := &Cluster{
		primary: primary,
		cfg:     cfg,
	}

	// Initialize replicas if provided
	if len(cfg.Replicas) > 0 {
		cluster.replicas = make([]*pgxpool.Pool, 0, len(cfg.Replicas))
		for _, replicaDSN := range cfg.Replicas {
			replicaConfig, err := pgxpool.ParseConfig(replicaDSN)
			if err != nil {
				// Close primary on replica init failure
				primary.Close()
				return nil, fmt.Errorf("db: parse replica DSN: %w", err)
			}
			applyPoolConfig(replicaConfig, poolCfg)

			replica, err := pgxpool.NewWithConfig(ctx, replicaConfig)
			if err != nil {
				// Log but don't fail - replicas are optional
				continue
			}
			cluster.replicas = append(cluster.replicas, replica)
		}
	}

	return cluster, nil
}

// applyPoolConfig applies pool settings to a pgx config.
func applyPoolConfig(cfg *pgxpool.Config, poolCfg PoolConfig) {
	cfg.MaxConns = poolCfg.MaxConns
	if cfg.MinConns == 0 && poolCfg.MinConns > 0 {
		cfg.MinConns = poolCfg.MinConns
	}
	cfg.MaxConnLifetime = poolCfg.MaxConnLifetime
	cfg.MaxConnIdleTime = poolCfg.MaxConnIdleTime
	cfg.HealthCheckPeriod = poolCfg.HealthCheckPeriod
}

// Primary returns the primary (write) connection pool.
func (c *Cluster) Primary() *pgxpool.Pool {
	return c.primary
}

// Replica returns a read replica connection pool using round-robin selection.
// Falls back to primary if no replicas are available.
func (c *Cluster) Replica() *pgxpool.Pool {
	if len(c.replicas) == 0 {
		return c.primary
	}

	idx := atomic.AddUint32(&c.rrIndex, 1) % uint32(len(c.replicas))
	return c.replicas[idx]
}

// Close closes all connection pools in the cluster.
func (c *Cluster) Close() error {
	if c == nil {
		return nil
	}

	if c.primary != nil {
		c.primary.Close()
	}

	for _, replica := range c.replicas {
		if replica != nil {
			replica.Close()
		}
	}

	return nil
}

// Ping checks connectivity to the primary database.
func (c *Cluster) Ping(ctx context.Context) error {
	if c == nil || c.primary == nil {
		return fmt.Errorf("db: cluster not initialized")
	}
	return c.primary.Ping(ctx)
}

// Schema returns the configured schema prefix.
func (c *Cluster) Schema() string {
	return c.cfg.Schema
}

// FullTableName returns the schema-qualified table name.
func (c *Cluster) FullTableName(table string) string {
	if c.cfg.Schema == "" {
		return quoteIdentifier(table)
	}
	return quoteIdentifier(c.cfg.Schema) + "." + quoteIdentifier(table)
}

// quoteIdentifier quotes a SQL identifier for safe use in queries.
func quoteIdentifier(ident string) string {
	// Double any existing double quotes
	quoted := ident
	for i := 0; i < len(quoted); i++ {
		if quoted[i] == '"' {
			quoted = quoted[:i] + `""` + quoted[i+1:]
			i++
		}
	}
	return `"` + quoted + `"`
}
