// Package db provides initialization helpers for the database layer.
package db

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// EnvConfig reads database configuration from environment variables.
// Supported environment variables:
//   - DB_PRIMARY or DATABASE_URL: Primary database DSN (required)
//   - DB_REPLICAS: Comma-separated replica DSNs (optional)
//   - DB_SCHEMA: Schema prefix for tables (optional)
//   - DB_POOL_MAX_CONNS: Maximum connections (default: 20)
//   - DB_POOL_MIN_CONNS: Minimum connections (default: 5)
//   - DB_POOL_MAX_CONN_LIFETIME: Connection max lifetime in seconds (default: 3600)
//   - DB_POOL_MAX_CONN_IDLE_TIME: Connection max idle time in seconds (default: 1800)
//   - DB_POOL_HEALTH_CHECK: Health check period in seconds (default: 60)
func EnvConfig() (ClusterConfig, error) {
	cfg := ClusterConfig{
		Pool: DefaultPoolConfig(),
	}

	// Get primary DSN
	primary := os.Getenv("DB_PRIMARY")
	if primary == "" {
		primary = os.Getenv("DATABASE_URL")
	}
	if primary == "" {
		return cfg, fmt.Errorf("DB_PRIMARY or DATABASE_URL environment variable is required")
	}
	cfg.Primary = primary

	// Get replicas
	if replicas := os.Getenv("DB_REPLICAS"); replicas != "" {
		for _, r := range strings.Split(replicas, ",") {
			if trimmed := strings.TrimSpace(r); trimmed != "" {
				cfg.Replicas = append(cfg.Replicas, trimmed)
			}
		}
	}

	// Get schema
	cfg.Schema = os.Getenv("DB_SCHEMA")

	// Get pool config
	if v := os.Getenv("DB_POOL_MAX_CONNS"); v != "" {
		if i, err := strconv.ParseInt(v, 10, 32); err == nil {
			cfg.Pool.MaxConns = int32(i)
		}
	}
	if v := os.Getenv("DB_POOL_MIN_CONNS"); v != "" {
		if i, err := strconv.ParseInt(v, 10, 32); err == nil {
			cfg.Pool.MinConns = int32(i)
		}
	}
	if v := os.Getenv("DB_POOL_MAX_CONN_LIFETIME"); v != "" {
		if i, err := strconv.ParseInt(v, 10, 64); err == nil {
			cfg.Pool.MaxConnLifetime = time.Duration(i) * time.Second
		}
	}
	if v := os.Getenv("DB_POOL_MAX_CONN_IDLE_TIME"); v != "" {
		if i, err := strconv.ParseInt(v, 10, 64); err == nil {
			cfg.Pool.MaxConnIdleTime = time.Duration(i) * time.Second
		}
	}
	if v := os.Getenv("DB_POOL_HEALTH_CHECK"); v != "" {
		if i, err := strconv.ParseInt(v, 10, 64); err == nil {
			cfg.Pool.HealthCheckPeriod = time.Duration(i) * time.Second
		}
	}

	return cfg, nil
}

// InitFromEnv creates a database repository from environment variables.
func InitFromEnv(ctx context.Context) (*Repo, error) {
	cfg, err := EnvConfig()
	if err != nil {
		return nil, err
	}
	return NewRepo(ctx, cfg)
}

// MustInitFromEnv creates a database repository from environment variables
// and panics on error. Useful for main package initialization.
func MustInitFromEnv(ctx context.Context) *Repo {
	repo, err := InitFromEnv(ctx)
	if err != nil {
		panic(err)
	}
	return repo
}
