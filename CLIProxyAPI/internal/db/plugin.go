// Package db provides a usage statistics plugin that persists to the database.
package db

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/router-for-me/CLIProxyAPI/v6/sdk/cliproxy/usage"
)

// UsagePlugin persists usage statistics to the database.
type UsagePlugin struct {
	repo    *Repo
	batch   []*usage.Record
	batchMu sync.Mutex
	batchSize int
	flushInterval time.Duration
	stopCh    chan struct{}
	wg        sync.WaitGroup
}

// NewUsagePlugin creates a new usage plugin that writes to the database.
func NewUsagePlugin(repo *Repo, opts ...UsagePluginOption) *UsagePlugin {
	p := &UsagePlugin{
		repo:          repo,
		batch:         make([]*usage.Record, 0, 100),
		batchSize:     100,
		flushInterval: 30 * time.Second,
		stopCh:        make(chan struct{}),
	}

	for _, opt := range opts {
		opt(p)
	}

	// Start background flush goroutine
	p.wg.Add(1)
	go p.flushLoop()

	return p
}

// UsagePluginOption configures the usage plugin.
type UsagePluginOption func(*UsagePlugin)

// WithBatchSize sets the batch size for flushing usage records.
func WithBatchSize(size int) UsagePluginOption {
	return func(p *UsagePlugin) {
		p.batchSize = size
	}
}

// WithFlushInterval sets the flush interval for usage records.
func WithFlushInterval(interval time.Duration) UsagePluginOption {
	return func(p *UsagePlugin) {
		p.flushInterval = interval
	}
}

// HandleUsage implements the usage.Plugin interface.
// It batches records in memory and flushes them periodically or when the batch is full.
func (p *UsagePlugin) HandleUsage(ctx context.Context, record usage.Record) {
	if record.RequestedAt.IsZero() {
		record.RequestedAt = time.Now()
	}

	p.batchMu.Lock()
	p.batch = append(p.batch, &record)
	shouldFlush := len(p.batch) >= p.batchSize
	p.batchMu.Unlock()

	if shouldFlush {
		_ = p.Flush(ctx)
	}
}

// Flush writes all pending usage records to the database.
func (p *UsagePlugin) Flush(ctx context.Context) error {
	p.batchMu.Lock()
	if len(p.batch) == 0 {
		p.batchMu.Unlock()
		return nil
	}

	// Copy and clear batch
	batch := make([]*usage.Record, len(p.batch))
	copy(batch, p.batch)
	p.batch = p.batch[:0]
	p.batchMu.Unlock()

	// Convert to database models
	stats := make([]*UsageStats, 0, len(batch))
	for _, r := range batch {
		if r.Provider == "" {
			continue
		}

		date := r.RequestedAt
		stat := &UsageStats{
			ID:            uuid.New().String(),
			Provider:      r.Provider,
			Model:         r.Model,
			AuthID:        r.AuthID,
			Date:          time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location()),
			RequestCount:  1,
			InputTokens:   r.Detail.InputTokens,
			OutputTokens:  r.Detail.OutputTokens,
			ReasoningTokens: r.Detail.ReasoningTokens,
			CachedTokens:  r.Detail.CachedTokens,
			SuccessCount:  0,
			ErrorCount:    0,
		}

		if r.Failed {
			stat.ErrorCount = 1
		} else {
			stat.SuccessCount = 1
		}

		stats = append(stats, stat)
	}

	if len(stats) == 0 {
		return nil
	}

	// Batch insert
	return p.repo.Batch().BatchInsertUsageStats(ctx, stats)
}

// flushLoop runs periodic flushes in the background.
func (p *UsagePlugin) flushLoop() {
	defer p.wg.Done()

	ticker := time.NewTicker(p.flushInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			_ = p.Flush(context.Background())
		case <-p.stopCh:
			// Final flush on shutdown
			_ = p.Flush(context.Background())
			return
		}
	}
}

// Close stops the background flush goroutine and flushes remaining records.
func (p *UsagePlugin) Close() error {
	close(p.stopCh)
	p.wg.Wait()
	return p.Flush(context.Background())
}

// RegisterUsagePlugin registers the database usage plugin with the global usage manager.
func RegisterUsagePlugin(repo *Repo, opts ...UsagePluginOption) {
	plugin := NewUsagePlugin(repo, opts...)
	usage.DefaultManager().Register(plugin)
}

// RequestLogger creates a usage.Plugin that logs to the request_logs table.
type RequestLogger struct {
	repo    *Repo
	batch   []*RequestLog
	batchMu sync.Mutex
	batchSize int
	stopCh    chan struct{}
	wg        sync.WaitGroup
}

// NewRequestLogger creates a new request logger.
func NewRequestLogger(repo *Repo, opts ...RequestLoggerOption) *RequestLogger {
	r := &RequestLogger{
		repo:      repo,
		batch:     make([]*RequestLog, 0, 100),
		batchSize: 100,
		stopCh:    make(chan struct{}),
	}

	for _, opt := range opts {
		opt(r)
	}

	r.wg.Add(1)
	go r.flushLoop()

	return r
}

// RequestLoggerOption configures the request logger.
type RequestLoggerOption func(*RequestLogger)

// WithLogBatchSize sets the batch size for flushing log entries.
func WithLogBatchSize(size int) RequestLoggerOption {
	return func(r *RequestLogger) {
		r.batchSize = size
	}
}

// HandleUsage implements the usage.Plugin interface for request logging.
func (r *RequestLogger) HandleUsage(ctx context.Context, record usage.Record) {
	log := &RequestLog{
		ID:           uuid.New().String(),
		RequestID:    uuid.New().String(),
		Provider:     record.Provider,
		Model:        record.Model,
		AuthID:       record.AuthID,
		ClientIP:     record.Source,
		StatusCode:   200,
		CreatedAt:    record.RequestedAt,
	}

	if record.Failed {
		log.StatusCode = 500
		log.ErrorMessage = fmt.Sprintf("request failed")
	}

	r.batchMu.Lock()
	r.batch = append(r.batch, log)
	shouldFlush := len(r.batch) >= r.batchSize
	r.batchMu.Unlock()

	if shouldFlush {
		_ = r.Flush(ctx)
	}
}

// Flush writes all pending log entries to the database.
func (r *RequestLogger) Flush(ctx context.Context) error {
	r.batchMu.Lock()
	if len(r.batch) == 0 {
		r.batchMu.Unlock()
		return nil
	}

	batch := make([]*RequestLog, len(r.batch))
	copy(batch, r.batch)
	r.batch = r.batch[:0]
	r.batchMu.Unlock()

	return r.repo.Batch().BatchInsertRequestLogs(ctx, batch)
}

func (r *RequestLogger) flushLoop() {
	defer r.wg.Done()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			_ = r.Flush(context.Background())
		case <-r.stopCh:
			_ = r.Flush(context.Background())
			return
		}
	}
}

// Close stops the background flush goroutine.
func (r *RequestLogger) Close() error {
	close(r.stopCh)
	r.wg.Wait()
	return r.Flush(context.Background())
}
