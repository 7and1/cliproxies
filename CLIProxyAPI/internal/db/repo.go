// Package db provides high-level repository operations for database entities.
package db

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// Repo provides high-level database operations with connection pooling and replica routing.
type Repo struct {
	cluster *Cluster
	q       *Queries
	schema  *SchemaManager
	migrate *MigrationManager
}

// NewRepo creates a new repository with the given cluster configuration.
func NewRepo(ctx context.Context, cfg ClusterConfig) (*Repo, error) {
	cluster, err := NewCluster(ctx, cfg)
	if err != nil {
		return nil, err
	}

	repo := &Repo{
		cluster: cluster,
		q:       NewQueries(cluster),
		schema:  NewSchemaManager(cluster),
		migrate: NewMigrationManager(cluster),
	}
	repo.migrate.RegisterDefaultMigrations()

	return repo, nil
}

// Close closes the database cluster connection.
func (r *Repo) Close() error {
	return r.cluster.Close()
}

// Cluster returns the underlying database cluster.
func (r *Repo) Cluster() *Cluster {
	return r.cluster
}

// Queries returns the prepared queries instance.
func (r *Repo) Queries() *Queries {
	return r.q
}

// Schema returns the schema manager.
func (r *Repo) Schema() *SchemaManager {
	return r.schema
}

// Migrate returns the migration manager.
func (r *Repo) Migrate() *MigrationManager {
	return r.migrate
}

// Initialize creates the database schema and runs migrations.
func (r *Repo) Initialize(ctx context.Context) error {
	// Initialize migration tracking
	if err := r.migrate.Initialize(ctx); err != nil {
		return fmt.Errorf("initialize migrations: %w", err)
	}

	// Run pending migrations
	if err := r.migrate.Up(ctx); err != nil {
		return fmt.Errorf("run migrations: %w", err)
	}

	return nil
}

// Ping checks database connectivity.
func (r *Repo) Ping(ctx context.Context) error {
	return r.cluster.Ping(ctx)
}

// TxOptions defines transaction options.
type TxOptions struct {
	// ReadOnly indicates if this is a read-only transaction.
	ReadOnly bool
	// Retryable indicates if the transaction should be retried on serialization failure.
	Retryable bool
}

// WithTx runs a function within a database transaction.
func (r *Repo) WithTx(ctx context.Context, opts TxOptions, fn func(tx pgx.Tx) error) error {
	options := pgx.TxOptions{
		AccessMode: pgx.ReadWrite,
	}
	if opts.ReadOnly {
		options.AccessMode = pgx.ReadOnly
	}

	maxRetries := 1
	if opts.Retryable {
		maxRetries = 3
	}

	var lastErr error
	for attempt := 0; attempt < maxRetries; attempt++ {
		tx, err := r.cluster.Primary().Begin(ctx)
		if err != nil {
			return fmt.Errorf("begin transaction: %w", err)
		}

		err = fn(tx)
		if err != nil {
			tx.Rollback(ctx)
			if isSerializationError(err) && attempt < maxRetries-1 {
				lastErr = err
				time.Sleep(backoffDuration(attempt))
				continue
			}
			return err
		}

		if err := tx.Commit(ctx); err != nil {
			if isSerializationError(err) && attempt < maxRetries-1 {
				lastErr = err
				time.Sleep(backoffDuration(attempt))
				continue
			}
			return fmt.Errorf("commit transaction: %w", err)
		}

		return nil
	}

	return fmt.Errorf("transaction failed after %d retries: %w", maxRetries, lastErr)
}

func isSerializationError(err error) bool {
	if pgErr, ok := err.(interface{ SQLState() string }); ok {
		return pgErr.SQLState() == "40001" // serialization_failure
	}
	return false
}

func backoffDuration(attempt int) time.Duration {
	return time.Duration(attempt*10) * time.Millisecond
}

// BatchOperations provides batch database operations.
type BatchOperations struct {
	repo *Repo
}

// Batch returns a batch operations instance.
func (r *Repo) Batch() *BatchOperations {
	return &BatchOperations{repo: r}
}

// BatchInsertUsageStats inserts multiple usage stats records efficiently.
func (b *BatchOperations) BatchInsertUsageStats(ctx context.Context, stats []*UsageStats) error {
	if len(stats) == 0 {
		return nil
	}

	table := b.repo.cluster.FullTableName("usage_stats")
	query := fmt.Sprintf(`
		INSERT INTO %s (id, provider, model, auth_id, date, request_count, input_tokens,
		                output_tokens, reasoning_tokens, cached_tokens, success_count, error_count)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (provider, model, auth_id, date)
		DO UPDATE SET request_count = %s.request_count + EXCLUDED.request_count,
		              input_tokens = %s.input_tokens + EXCLUDED.input_tokens,
		              output_tokens = %s.output_tokens + EXCLUDED.output_tokens,
		              reasoning_tokens = COALESCE(%s.reasoning_tokens, 0) + COALESCE(EXCLUDED.reasoning_tokens, 0),
		              cached_tokens = COALESCE(%s.cached_tokens, 0) + COALESCE(EXCLUDED.cached_tokens, 0),
		              success_count = %s.success_count + EXCLUDED.success_count,
		              error_count = %s.error_count + EXCLUDED.error_count,
		              updated_at = NOW()
	`, table, table, table, table, table, table, table, table)

	batch := &pgx.Batch{}
	for _, stat := range stats {
		if stat.ID == "" {
			stat.ID = uuid.New().String()
		}
		batch.Queue(query,
			stat.ID, stat.Provider, stat.Model, stat.AuthID, stat.Date,
			stat.RequestCount, stat.InputTokens, stat.OutputTokens,
			stat.ReasoningTokens, stat.CachedTokens, stat.SuccessCount, stat.ErrorCount,
		)
	}

	return b.repo.cluster.Primary().SendBatch(ctx, batch).Close()
}

// BatchInsertRequestLogs inserts multiple request log entries efficiently.
func (b *BatchOperations) BatchInsertRequestLogs(ctx context.Context, logs []*RequestLog) error {
	if len(logs) == 0 {
		return nil
	}

	table := b.repo.cluster.FullTableName("request_logs")
	query := fmt.Sprintf(`
		INSERT INTO %s (id, request_id, provider, model, auth_id, api_key_hash,
		                client_ip, user_agent, method, path, status_code, latency_ms,
		                input_tokens, output_tokens, error_message)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`, table)

	batch := &pgx.Batch{}
	for _, log := range logs {
		if log.ID == "" {
			log.ID = uuid.New().String()
		}
		batch.Queue(query,
			log.ID, log.RequestID, log.Provider, log.Model, log.AuthID, log.APIKeyHash,
			log.ClientIP, log.UserAgent, log.Method, log.Path,
			log.StatusCode, log.LatencyMs, log.InputTokens, log.OutputTokens, log.ErrorMessage,
		)
	}

	return b.repo.cluster.Primary().SendBatch(ctx, batch).Close()
}

// Analytics provides analytics query methods.
type Analytics struct {
	repo *Repo
}

// Analytics returns an analytics query instance.
func (r *Repo) Analytics() *Analytics {
	return &Analytics{repo: r}
}

// GetUsageSummary returns usage statistics grouped by provider and model.
func (a *Analytics) GetUsageSummary(ctx context.Context, startDate, endDate time.Time) ([]UsageSummary, error) {
	table := a.repo.cluster.FullTableName("usage_stats")
	query := fmt.Sprintf(`
		SELECT provider, model,
		       SUM(request_count) as total_requests,
		       SUM(input_tokens) as total_input_tokens,
		       SUM(output_tokens) as total_output_tokens,
		       SUM(reasoning_tokens) as total_reasoning_tokens,
		       SUM(cached_tokens) as total_cached_tokens,
		       SUM(total_tokens) as total_tokens,
		       SUM(success_count) as total_success,
		       SUM(error_count) as total_errors,
		       COUNT(DISTINCT auth_id) as unique_auths
		FROM %s
		WHERE date >= $1 AND date <= $2
		GROUP BY provider, model
		ORDER BY total_requests DESC
	`, table)

	rows, err := a.repo.cluster.Replica().Query(ctx, query, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []UsageSummary
	for rows.Next() {
		var s UsageSummary
		if err := rows.Scan(
			&s.Provider, &s.Model, &s.TotalRequests, &s.TotalInputTokens,
			&s.TotalOutputTokens, &s.TotalReasoningTokens, &s.TotalCachedTokens,
			&s.TotalTokens, &s.TotalSuccess, &s.TotalErrors, &s.UniqueAuths,
		); err != nil {
			return nil, err
		}
		summaries = append(summaries, s)
	}

	return summaries, rows.Err()
}

// UsageSummary represents aggregated usage statistics.
type UsageSummary struct {
	Provider           string `json:"provider"`
	Model              string `json:"model"`
	TotalRequests      int64  `json:"total_requests"`
	TotalInputTokens   int64  `json:"total_input_tokens"`
	TotalOutputTokens  int64  `json:"total_output_tokens"`
	TotalReasoningTokens int64 `json:"total_reasoning_tokens"`
	TotalCachedTokens  int64  `json:"total_cached_tokens"`
	TotalTokens        int64  `json:"total_tokens"`
	TotalSuccess       int64  `json:"total_success"`
	TotalErrors        int64  `json:"total_errors"`
	UniqueAuths        int64  `json:"unique_auths"`
}

// GetTopAuthsByUsage returns the top auth entries by usage.
func (a *Analytics) GetTopAuthsByUsage(ctx context.Context, startDate, endDate time.Time, limit int32) ([]AuthUsage, error) {
	table := a.repo.cluster.FullTableName("usage_stats")
	query := fmt.Sprintf(`
		SELECT auth_id,
		       SUM(request_count) as total_requests,
		       SUM(total_tokens) as total_tokens,
		       COUNT(DISTINCT model) as model_count
		FROM %s
		WHERE date >= $1 AND date <= $2
		GROUP BY auth_id
		ORDER BY total_requests DESC
		LIMIT $3
	`, table)

	rows, err := a.repo.cluster.Replica().Query(ctx, query, startDate, endDate, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []AuthUsage
	for rows.Next() {
		var a AuthUsage
		if err := rows.Scan(&a.AuthID, &a.TotalRequests, &a.TotalTokens, &a.ModelCount); err != nil {
			return nil, err
		}
		results = append(results, a)
	}

	return results, rows.Err()
}

// AuthUsage represents usage statistics for a single auth entry.
type AuthUsage struct {
	AuthID       string `json:"auth_id"`
	TotalRequests int64  `json:"total_requests"`
	TotalTokens  int64  `json:"total_tokens"`
	ModelCount   int64  `json:"model_count"`
}

// GetErrorRate returns error rates grouped by provider and model.
func (a *Analytics) GetErrorRate(ctx context.Context, startDate, endDate time.Time) ([]ErrorRate, error) {
	logTable := a.repo.cluster.FullTableName("request_logs")
	query := fmt.Sprintf(`
		SELECT provider, model,
		       COUNT(*) as total_requests,
		       SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_requests,
		       ROUND(100.0 * SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)::numeric / COUNT(*), 2) as error_rate
		FROM %s
		WHERE created_at >= $1 AND created_at < $2
		GROUP BY provider, model
		HAVING COUNT(*) >= 10
		ORDER BY error_rate DESC
	`, logTable)

	rows, err := a.repo.cluster.Replica().Query(ctx, query, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []ErrorRate
	for rows.Next() {
		var e ErrorRate
		if err := rows.Scan(&e.Provider, &e.Model, &e.TotalRequests, &e.ErrorRequests, &e.ErrorRate); err != nil {
			return nil, err
		}
		results = append(results, e)
	}

	return results, rows.Err()
}

// ErrorRate represents error statistics for a provider/model combination.
type ErrorRate struct {
	Provider      string  `json:"provider"`
	Model         string  `json:"model"`
	TotalRequests int64   `json:"total_requests"`
	ErrorRequests int64   `json:"error_requests"`
	ErrorRate     float64 `json:"error_rate"`
}
