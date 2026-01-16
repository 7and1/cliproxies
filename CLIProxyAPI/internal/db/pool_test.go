// Package db tests for database connection pool management
package db

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PoolConfig holds configuration for the database connection pool
type PoolConfig struct {
	MaxConns           int32
	MinConns           int32
	MaxConnLifetime    time.Duration
	MaxConnIdleTime    time.Duration
	HealthCheckPeriod  time.Duration
	ConnectTimeout     time.Duration
}

// DefaultPoolConfig returns sensible defaults for the connection pool
func DefaultPoolConfig() PoolConfig {
	return PoolConfig{
		MaxConns:          10,
		MinConns:          2,
		MaxConnLifetime:   1 * time.Hour,
		MaxConnIdleTime:   30 * time.Minute,
		HealthCheckPeriod: 1 * time.Minute,
		ConnectTimeout:    5 * time.Second,
	}
}

// Cluster represents a database cluster with primary and replica support
type Cluster struct {
	primary  *pgxpool.Pool
	replica  *pgxpool.Pool
	config   PoolConfig
	tablePrefix string
	mu       sync.RWMutex
}

// PoolStats tracks connection pool statistics
type PoolStats struct {
	TotalConns      int32
	IdleConns       int32
	AcquireCount    int64
	ReleaseCount    int64
	AcquireDuration int64 // nanoseconds
	MaxConns        int32
	MinConns        int32
}

// MockPool implements a mock connection pool for testing
type MockPool struct {
	conns          chan *pgx.Conn
	maxConns       int32
	activeConns    int32
	acquireCount   int64
	releaseCount   int64
	acquireTime    int64
	closed         bool
	mu             sync.Mutex
	acquireDelay   time.Duration
	shouldFail     bool
	failCount      int32
}

// NewMockPool creates a new mock connection pool
func NewMockPool(maxConns int32) *MockPool {
	return &MockPool{
		conns:    make(chan *pgx.Conn, maxConns),
		maxConns: maxConns,
	}
}

// Acquire acquires a connection from the pool
func (m *MockPool) Acquire(ctx context.Context) (*pgx.Conn, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.closed {
		return nil, fmt.Errorf("pool is closed")
	}

	if m.acquireDelay > 0 {
		time.Sleep(m.acquireDelay)
	}

	if m.shouldFail {
		atomic.AddInt32(&m.failCount, 1)
		return nil, fmt.Errorf("acquire failed")
	}

	start := time.Now()
	atomic.AddInt64(&m.acquireCount, 1)
	atomic.AddInt64(&m.acquireTime, time.Since(start).Nanoseconds())

	// Create a mock connection
	select {
	case conn := <-m.conns:
		atomic.AddInt32(&m.activeConns, 1)
		return conn, nil
	default:
		if atomic.LoadInt32(&m.activeConns) >= m.maxConns {
			return nil, fmt.Errorf("pool exhausted")
		}
		// Return a mock connection
		atomic.AddInt32(&m.activeConns, 1)
		return &pgx.Conn{}, nil
	}
}

// Release releases a connection back to the pool
func (m *MockPool) Release(conn *pgx.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.closed {
		return
	}

	atomic.AddInt64(&m.releaseCount, 1)
	atomic.AddInt32(&m.activeConns, -1)
	select {
	case m.conns <- conn:
	default:
		// Channel full, discard connection
	}
}

// Close closes the pool
func (m *MockPool) Close() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.closed = true
	close(m.conns)
	for range m.conns {
		// Drain connections
	}
}

// Stat returns pool statistics
func (m *MockPool) Stat() *pgxpool.Stat {
	active := atomic.LoadInt32(&m.activeConns)
	return &pgxpool.Stat{
		TotalConns: int32(len(m.conns)) + active,
		IdleConns:  int32(len(m.conns)),
		MaxConns:   m.maxConns,
	}
}

// Ping checks if the pool is responsive
func (m *MockPool) Ping(ctx context.Context) error {
	if m.closed {
		return fmt.Errorf("pool closed")
	}
	return nil
}

// SetAcquireDelay sets a delay for connection acquisition (for testing timeouts)
func (m *MockPool) SetAcquireDelay(delay time.Duration) {
	m.acquireDelay = delay
}

// SetFailMode sets whether connection acquisition should fail
func (m *MockPool) SetFailMode(shouldFail bool) {
	m.shouldFail = shouldFail
}

// GetStats returns current statistics
func (m *MockPool) GetStats() PoolStats {
	active := atomic.LoadInt32(&m.activeConns)
	return PoolStats{
		TotalConns:      int32(len(m.conns)) + active,
		IdleConns:       int32(len(m.conns)),
		AcquireCount:    atomic.LoadInt64(&m.acquireCount),
		ReleaseCount:    atomic.LoadInt64(&m.releaseCount),
		AcquireDuration: atomic.LoadInt64(&m.acquireTime),
		MaxConns:        m.maxConns,
		MinConns:        0,
	}
}

// Table-driven tests for connection pool

func TestMockPool_BasicAcquireRelease(t *testing.T) {
	tests := []struct {
		name     string
		maxConns int32
		ops      int
	}{
		{"small pool", 2, 10},
		{"medium pool", 5, 20},
		{"large pool", 10, 50},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pool := NewMockPool(tt.maxConns)
			defer pool.Close()

			for i := 0; i < tt.ops; i++ {
				conn, err := pool.Acquire(context.Background())
				if err != nil {
					t.Fatalf("Acquire() failed: %v", err)
				}
				if conn == nil {
					t.Error("Acquire() returned nil connection")
				}
				pool.Release(conn)
			}

			stats := pool.GetStats()
			if stats.AcquireCount != int64(tt.ops) {
				t.Errorf("AcquireCount = %d, want %d", stats.AcquireCount, tt.ops)
			}
			if stats.ReleaseCount != int64(tt.ops) {
				t.Errorf("ReleaseCount = %d, want %d", stats.ReleaseCount, tt.ops)
			}
		})
	}
}

func TestMockPool_Concurrency(t *testing.T) {
	pool := NewMockPool(10)
	defer pool.Close()

	var wg sync.WaitGroup
	goroutines := 50
	opsPerGoroutine := 100

	start := make(chan struct{})

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start

			for j := 0; j < opsPerGoroutine; j++ {
				conn, err := pool.Acquire(context.Background())
				if err != nil {
					t.Errorf("Acquire() failed: %v", err)
					continue
				}
				pool.Release(conn)
			}
		}()
	}

	close(start)
	wg.Wait()

	stats := pool.GetStats()
	expectedOps := int64(goroutines * opsPerGoroutine)
	if stats.AcquireCount != expectedOps {
		t.Errorf("AcquireCount = %d, want %d", stats.AcquireCount, expectedOps)
	}
	if stats.ReleaseCount != expectedOps {
		t.Errorf("ReleaseCount = %d, want %d", stats.ReleaseCount, expectedOps)
	}
}

func TestMockPool_PoolExhaustion(t *testing.T) {
	pool := NewMockPool(2)
	defer pool.Close()

	var conns []*pgx.Conn

	// Acquire all connections
	for i := 0; i < 2; i++ {
		conn, err := pool.Acquire(context.Background())
		if err != nil {
			t.Fatalf("Acquire() failed: %v", err)
		}
		conns = append(conns, conn)
	}

	// Try to acquire one more - should fail
	_, err := pool.Acquire(context.Background())
	if err == nil {
		t.Error("Acquire() should fail when pool is exhausted")
	}

	// Release one connection
	pool.Release(conns[0])

	// Now acquire should succeed
	conn, err := pool.Acquire(context.Background())
	if err != nil {
		t.Errorf("Acquire() after release failed: %v", err)
	}
	if conn == nil {
		t.Error("Acquire() returned nil connection")
	}

	// Cleanup
	pool.Release(conns[1])
	pool.Release(conn)
}

func TestMockPool_Close(t *testing.T) {
	pool := NewMockPool(5)

	// Acquire and release a connection
	conn, err := pool.Acquire(context.Background())
	if err != nil {
		t.Fatalf("Acquire() failed: %v", err)
	}
	pool.Release(conn)

	// Close the pool
	pool.Close()

	// Acquire after close should fail
	_, err = pool.Acquire(context.Background())
	if err == nil {
		t.Error("Acquire() after Close() should fail")
	}

	// Release after close should be safe (no panic)
	pool.Release(conn)
}

func TestMockPool_AcquireTimeout(t *testing.T) {
	pool := NewMockPool(2)
	defer pool.Close()

	// Set acquire delay
	pool.SetAcquireDelay(200 * time.Millisecond)

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	start := time.Now()
	_, err := pool.Acquire(ctx)
	elapsed := time.Since(start)

	if err == nil {
		t.Error("Acquire() with timeout should fail")
	}

	if elapsed < 100*time.Millisecond {
		t.Errorf("Acquire() returned too quickly: %v", elapsed)
	}
}

func TestMockPool_FailMode(t *testing.T) {
	pool := NewMockPool(5)
	defer pool.Close()

	// Set fail mode
	pool.SetFailMode(true)

	// Acquire should fail
	_, err := pool.Acquire(context.Background())
	if err == nil {
		t.Error("Acquire() in fail mode should return error")
	}

	// Check fail count
	if atomic.LoadInt32(&pool.failCount) != 1 {
		t.Errorf("failCount = %d, want 1", atomic.LoadInt32(&pool.failCount))
	}

	// Disable fail mode
	pool.SetFailMode(false)

	// Now acquire should succeed
	conn, err := pool.Acquire(context.Background())
	if err != nil {
		t.Errorf("Acquire() after disabling fail mode failed: %v", err)
	}
	if conn != nil {
		pool.Release(conn)
	}
}

func TestMockPool_Stats(t *testing.T) {
	pool := NewMockPool(5)
	defer pool.Close()

	stats := pool.GetStats()

	if stats.MaxConns != 5 {
		t.Errorf("MaxConns = %d, want 5", stats.MaxConns)
	}

	if stats.TotalConns != 0 {
		t.Errorf("Initial TotalConns = %d, want 0", stats.TotalConns)
	}

	// Acquire a connection
	conn, _ := pool.Acquire(context.Background())
	stats = pool.GetStats()

	if stats.TotalConns != 1 {
		t.Errorf("TotalConns after acquire = %d, want 1", stats.TotalConns)
	}

	if stats.IdleConns != 0 {
		t.Errorf("IdleConns with active connection = %d, want 0", stats.IdleConns)
	}

	// Release the connection
	pool.Release(conn)
	stats = pool.GetStats()

	if stats.IdleConns != 1 {
		t.Errorf("IdleConns after release = %d, want 1", stats.IdleConns)
	}
}

func TestPoolConfig_Validation(t *testing.T) {
	tests := []struct {
		name    string
		config  PoolConfig
		wantMax int32
		wantMin int32
	}{
		{
			name: "valid config",
			config: PoolConfig{
				MaxConns: 10,
				MinConns: 2,
			},
			wantMax: 10,
			wantMin: 2,
		},
		{
			name: "zero values get defaults",
			config: PoolConfig{},
			wantMax: 10,
			wantMin: 2,
		},
		{
			name: "min greater than max",
			config: PoolConfig{
				MaxConns: 2,
				MinConns: 10,
			},
			wantMax: 2,
			wantMin: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := normalizePoolConfig(tt.config)
			if cfg.MaxConns != tt.wantMax {
				t.Errorf("MaxConns = %d, want %d", cfg.MaxConns, tt.wantMax)
			}
			if cfg.MinConns > cfg.MaxConns {
				cfg.MinConns = cfg.MaxConns
			}
			if cfg.MinConns != tt.wantMin {
				t.Errorf("MinConns = %d, want %d", cfg.MinConns, tt.wantMin)
			}
		})
	}
}

func TestPoolConfig_Defaults(t *testing.T) {
	cfg := DefaultPoolConfig()

	if cfg.MaxConns != 10 {
		t.Errorf("Default MaxConns = %d, want 10", cfg.MaxConns)
	}
	if cfg.MinConns != 2 {
		t.Errorf("Default MinConns = %d, want 2", cfg.MinConns)
	}
	if cfg.MaxConnLifetime != 1*time.Hour {
		t.Errorf("Default MaxConnLifetime = %v, want 1h", cfg.MaxConnLifetime)
	}
	if cfg.MaxConnIdleTime != 30*time.Minute {
		t.Errorf("Default MaxConnIdleTime = %v, want 30m", cfg.MaxConnIdleTime)
	}
	if cfg.HealthCheckPeriod != 1*time.Minute {
		t.Errorf("Default HealthCheckPeriod = %v, want 1m", cfg.HealthCheckPeriod)
	}
	if cfg.ConnectTimeout != 5*time.Second {
		t.Errorf("Default ConnectTimeout = %v, want 5s", cfg.ConnectTimeout)
	}
}

func TestMockPool_Ping(t *testing.T) {
	pool := NewMockPool(5)
	defer pool.Close()

	err := pool.Ping(context.Background())
	if err != nil {
		t.Errorf("Ping() on open pool failed: %v", err)
	}

	pool.Close()

	err = pool.Ping(context.Background())
	if err == nil {
		t.Error("Ping() on closed pool should fail")
	}
}

func TestMockPool_ConcurrentClose(t *testing.T) {
	pool := NewMockPool(10)

	var wg sync.WaitGroup
	// Start goroutines that acquire and release
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 100; j++ {
				conn, err := pool.Acquire(context.Background())
				if err == nil {
					pool.Release(conn)
				}
				time.Sleep(time.Microsecond)
			}
		}()
	}

	// Close pool concurrently
	go func() {
		time.Sleep(10 * time.Millisecond)
		pool.Close()
	}()

	wg.Wait()
	// Should not panic or deadlock
}

func TestPoolStats_Calculation(t *testing.T) {
	pool := NewMockPool(5)
	defer pool.SetAcquireDelay(10 * time.Millisecond)
	defer pool.Close()

	// Do some operations
	for i := 0; i < 5; i++ {
		conn, _ := pool.Acquire(context.Background())
		pool.Release(conn)
	}

	stats := pool.GetStats()

	if stats.AcquireCount != 5 {
		t.Errorf("AcquireCount = %d, want 5", stats.AcquireCount)
	}

	if stats.ReleaseCount != 5 {
		t.Errorf("ReleaseCount = %d, want 5", stats.ReleaseCount)
	}

	// Check average acquire duration
	avgDuration := time.Duration(stats.AcquireDuration / stats.AcquireCount)
	if avgDuration < 10*time.Millisecond {
		t.Errorf("Average acquire duration = %v, want at least 10ms", avgDuration)
	}
}

func TestMockPool_ConnectionReuse(t *testing.T) {
	pool := NewMockPool(2)
	defer pool.Close()

	var conns []*pgx.Conn

	// Acquire all connections
	for i := 0; i < 2; i++ {
		conn, _ := pool.Acquire(context.Background())
		conns = append(conns, conn)
	}

	// Release them
	for _, conn := range conns {
		pool.Release(conn)
	}

	stats := pool.GetStats()
	if stats.IdleConns != 2 {
		t.Errorf("IdleConns = %d, want 2", stats.IdleConns)
	}

	// Acquire again - should reuse connections
	for i := 0; i < 2; i++ {
		conn, _ := pool.Acquire(context.Background())
		pool.Release(conn)
	}

	// Total connections should still be 2 (reuse)
	stats = pool.GetStats()
	if stats.TotalConns != 2 {
		t.Errorf("TotalConns after reuse = %d, want 2", stats.TotalConns)
	}
}

// Helper function to normalize pool config
func normalizePoolConfig(config PoolConfig) PoolConfig {
	if config.MaxConns <= 0 {
		config.MaxConns = 10
	}
	if config.MinConns < 0 {
		config.MinConns = 0
	}
	if config.MinConns > config.MaxConns {
		config.MinConns = config.MaxConns
	}
	if config.MaxConnLifetime <= 0 {
		config.MaxConnLifetime = 1 * time.Hour
	}
	if config.MaxConnIdleTime <= 0 {
		config.MaxConnIdleTime = 30 * time.Minute
	}
	if config.HealthCheckPeriod <= 0 {
		config.HealthCheckPeriod = 1 * time.Minute
	}
	if config.ConnectTimeout <= 0 {
		config.ConnectTimeout = 5 * time.Second
	}
	return config
}

// MockPgConn is a mock for testing pgx.Conn behavior
type MockPgConn struct {
	pgx.Conn
	closed bool
}

// Close implements pgx.Conn interface
func (m *MockPgConn) Close(ctx context.Context) error {
	m.closed = true
	return nil
}

// Ping implements a ping method
func (m *MockPgConn) Ping(ctx context.Context) error {
	if m.closed {
		return fmt.Errorf("connection closed")
	}
	return nil
}

// MockConn is a mock connection for testing
type MockConn struct {
	*MockPgConn
}

// QueryRow implements a mock query method
func (m *MockConn) QueryRow(ctx context.Context, sql string, args ...interface{}) pgx.Row {
	return &MockRow{nil}
}

// MockRow is a mock row for testing
type MockRow struct {
	data interface{}
}

// Scan implements mock scan
func (m *MockRow) Scan(dest ...interface{}) error {
	return nil
}

// MockResult is a mock result for testing
type MockResult struct{}

// Close implements closer
func (m *MockResult) Close() error {
	return nil
}
