// Package store provides persistence backends for configuration and authentication data.
// This file implements a connection pool wrapper for PostgreSQL using pgxpool.
package store

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PoolConfig holds configuration for the PostgreSQL connection pool
type PoolConfig struct {
	MaxConns        int32         // Maximum number of connections (default: 20)
	MinConns        int32         // Minimum number of connections (default: 5)
	MaxConnLifetime time.Duration // Maximum connection lifetime (default: 1 hour)
	MaxConnIdleTime time.Duration // Maximum idle time (default: 30 minutes)
	HealthCheck     time.Duration // Health check interval (default: 1 minute)
}

// DefaultPoolConfig returns sensible defaults for connection pooling
func DefaultPoolConfig() PoolConfig {
	return PoolConfig{
		MaxConns:        20,
		MinConns:        5,
		MaxConnLifetime: time.Hour,
		MaxConnIdleTime: 30 * time.Minute,
		HealthCheck:     time.Minute,
	}
}

// Pool wraps pgxpool.Pool with additional metadata
type Pool struct {
	pool *pgxpool.Pool
	cfg  PoolConfig
	once sync.Once
}

// NewPool creates a new PostgreSQL connection pool with the given configuration
func NewPool(ctx context.Context, dsn string, poolCfg PoolConfig) (*Pool, error) {
	if dsn == "" {
		return nil, fmt.Errorf("postgres pool: DSN is required")
	}

	// Apply defaults
	if poolCfg.MaxConns <= 0 {
		poolCfg.MaxConns = 20
	}
	if poolCfg.MinConns <= 0 {
		poolCfg.MinConns = 5
	}
	if poolCfg.MaxConns < poolCfg.MinConns {
		poolCfg.MinConns = poolCfg.MaxConns
	}
	if poolCfg.MaxConnLifetime <= 0 {
		poolCfg.MaxConnLifetime = time.Hour
	}
	if poolCfg.MaxConnIdleTime <= 0 {
		poolCfg.MaxConnIdleTime = 30 * time.Minute
	}
	if poolCfg.HealthCheck <= 0 {
		poolCfg.HealthCheck = time.Minute
	}

	// Parse and configure the pool
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("postgres pool: parse config: %w", err)
	}

	// Apply pool configuration
	config.MaxConns = poolCfg.MaxConns
	config.MinConns = poolCfg.MinConns
	config.MaxConnLifetime = poolCfg.MaxConnLifetime
	config.MaxConnIdleTime = poolCfg.MaxConnIdleTime
	config.HealthCheckPeriod = poolCfg.HealthCheck

	// Create the pool
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("postgres pool: create pool: %w", err)
	}

	return &Pool{
		pool: pool,
		cfg:  poolCfg,
	}, nil
}

// Ping verifies the connection to the database is still alive
func (p *Pool) Ping(ctx context.Context) error {
	if p == nil || p.pool == nil {
		return fmt.Errorf("postgres pool: not initialized")
	}
	return p.pool.Ping(ctx)
}

// Close closes the connection pool
func (p *Pool) Close() error {
	if p == nil || p.pool == nil {
		return nil
	}
	p.pool.Close()
	return nil
}

// Stats returns connection pool statistics
func (p *Pool) Stats() *pgxpool.Stat {
	if p == nil || p.pool == nil {
		return nil
	}
	return p.pool.Stat()
}

// P returns the underlying pgxpool.Pool
func (p *Pool) P() *pgxpool.Pool {
	return p.pool
}

// Config returns the pool configuration
func (p *Pool) Config() PoolConfig {
	return p.cfg
}

// String returns a string representation of the pool status
func (p *Pool) String() string {
	if p == nil || p.pool == nil {
		return "Pool{nil}"
	}
	stats := p.pool.Stat()
	return fmt.Sprintf("Pool{conns: %d/%d (idle: %d, acq: %d)}",
		stats.TotalConns(),
		p.cfg.MaxConns,
		stats.IdleConns(),
		stats.AcquireCount(),
	)
}

// ParseDSNWithPoolOptions parses a DSN and adds pool configuration as query parameters
func ParseDSNWithPoolOptions(baseDSN string, poolCfg PoolConfig) (string, error) {
	if baseDSN == "" {
		return "", fmt.Errorf("DSN is required")
	}

	// Apply defaults
	if poolCfg.MaxConns <= 0 {
		poolCfg.MaxConns = 20
	}
	if poolCfg.MinConns <= 0 {
		poolCfg.MinConns = 5
	}

	separator := "?"
	if strings.Contains(baseDSN, "?") {
		separator = "&"
	}

	options := fmt.Sprintf("%spool_max_conns=%d&pool_min_conns=%d&pool_max_conn_lifetime=%ds&pool_max_conn_idle_time=%ds",
		separator,
		poolCfg.MaxConns,
		poolCfg.MinConns,
		int(poolCfg.MaxConnLifetime.Seconds()),
		int(poolCfg.MaxConnIdleTime.Seconds()),
	)

	return baseDSN + options, nil
}
