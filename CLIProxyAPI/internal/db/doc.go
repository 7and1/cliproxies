// Package db provides a production-ready database layer for CLIProxyAPI.
//
// Features:
//   - Connection pooling with pgxpool for optimal performance
//   - Read replica support with round-robin load balancing
//   - Prepared statements for efficient query execution
//   - Migration system with rollback capability
//   - Batch operations for high-throughput scenarios
//   - Analytics queries for usage monitoring
//
// Basic Usage:
//
//	// Initialize the database repository
//	repo, err := db.NewRepo(ctx, db.ClusterConfig{
//	    Primary: os.Getenv("DATABASE_URL"),
//	    Replicas: []string{
//	        os.Getenv("DATABASE_REPLICA_URL"),
//	    },
//	    Pool: db.DefaultPoolConfig(),
//	})
//	if err != nil {
//	    log.Fatal(err)
//	}
//	defer repo.Close()
//
//	// Run migrations
//	if err := repo.Initialize(ctx); err != nil {
//	    log.Fatal(err)
//	}
//
//	// Use queries
//	q := repo.Queries()
//	token, err := q.SelectOAuthTokenByUser(ctx, "claude", "user@example.com")
//
// Configuration:
//
// The database cluster can be configured via environment variables:
//   - DB_PRIMARY: Primary database DSN (required)
//   - DB_REPLICAS: Comma-separated replica DSNs (optional)
//   - DB_SCHEMA: Schema prefix for tables (optional)
//   - DB_POOL_MAX_CONNS: Maximum connections (default: 20)
//   - DB_POOL_MIN_CONNS: Minimum connections (default: 5)
package db
