// Package main provides a CLI tool for database migrations and maintenance.
package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/router-for-me/CLIProxyAPI/v6/internal/db"
)

var (
	version = "dev"
	commit  = "none"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	command := os.Args[1]

	switch command {
	case "migrate", "up":
		runMigrations(ctx)
	case "rollback", "down":
		rollbackMigration(ctx)
	case "status":
		showStatus(ctx)
	case "create":
		createSchema(ctx)
	case "cleanup":
		cleanupExpired(ctx)
	case "vacuum":
		vacuumTables(ctx)
	case "stats":
		showStats(ctx)
	case "version":
		fmt.Printf("db-tool version %s, commit %s\n", version, commit)
	default:
		fmt.Fprintf(os.Stderr, "Unknown command: %s\n\n", command)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Fprintf(os.Stderr, `Usage: db-tool <command> [options]

Commands:
  migrate, up     Apply pending database migrations
  rollback, down  Rollback the most recent migration
  status          Show migration status
  create          Create database schema (without migrations)
  cleanup         Remove expired cache entries and inactive tokens
  vacuum          Run VACUUM ANALYZE on all tables
  stats           Show table statistics

Environment Variables:
  DB_PRIMARY, DATABASE_URL   Primary database DSN (required)
  DB_REPLICAS               Comma-separated replica DSNs (optional)
  DB_SCHEMA                 Schema prefix for tables (optional)
  DB_POOL_MAX_CONNS         Maximum connections (default: 20)
  DB_POOL_MIN_CONNS         Minimum connections (default: 5)

Examples:
  # Run migrations
  db-tool migrate

  # Check status
  db-tool status

  # Cleanup expired entries
  db-tool cleanup

  # Show table stats
  db-tool stats
`)
}

func getRepo(ctx context.Context) *db.Repo {
	repo, err := db.InitFromEnv(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error connecting to database: %v\n", err)
		fmt.Fprintf(os.Stderr, "\nEnsure DB_PRIMARY or DATABASE_URL environment variable is set.\n")
		os.Exit(1)
	}
	return repo
}

func runMigrations(ctx context.Context) {
	repo := getRepo(ctx)
	defer repo.Close()

	// Initialize migrations
	mgr := repo.Migrate()
	mgr.RegisterDefaultMigrations()

	// Check pending
	pending, err := mgr.Pending(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error checking migrations: %v\n", err)
		os.Exit(1)
	}

	if len(pending) == 0 {
		fmt.Println("No pending migrations.")
		return
	}

	fmt.Printf("Applying %d migration(s)...\n", len(pending))
	for _, m := range pending {
		fmt.Printf("  - %s: %s\n", m.Version, m.Name)
	}

	if err := mgr.Up(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "Error applying migrations: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Migrations applied successfully!")
}

func rollbackMigration(ctx context.Context) {
	repo := getRepo(ctx)
	defer repo.Close()

	mgr := repo.Migrate()
	mgr.RegisterDefaultMigrations()

	if err := mgr.Down(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "Error rolling back migration: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Migration rolled back successfully!")
}

func showStatus(ctx context.Context) {
	repo := getRepo(ctx)
	defer repo.Close()

	mgr := repo.Migrate()
	mgr.RegisterDefaultMigrations()

	statuses, err := mgr.Status(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting migration status: %v\n", err)
		os.Exit(1)
	}

	latest, _ := mgr.GetLatestVersion(ctx)

	fmt.Println("Migration Status:")
	fmt.Println("=================")
	if latest != "" {
		fmt.Printf("Latest Applied: %s\n\n", latest)
	} else {
		fmt.Println("Latest Applied: (none)")
	}

	if len(statuses) == 0 {
		fmt.Println("No migrations registered.")
		return
	}

	for _, s := range statuses {
		status := "   [PENDING]"
		if s.Status == "applied" {
			status = "[APPLIED] "
		}
		fmt.Printf("  %s %s: %s\n", status, s.Version, s.Name)
		if !s.AppliedAt.IsZero() {
			fmt.Printf("             Applied: %s\n", s.AppliedAt.Format(time.RFC3339))
		}
	}
}

func createSchema(ctx context.Context) {
	repo := getRepo(ctx)
	defer repo.Close()

	schema := repo.Schema()

	fmt.Println("Creating database schema...")
	if err := schema.CreateSchema(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "Error creating schema: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Schema created successfully!")
}

func cleanupExpired(ctx context.Context) {
	repo := getRepo(ctx)
	defer repo.Close()

	schema := repo.Schema()

	fmt.Println("Cleaning up expired entries...")
	count, err := schema.CleanupExpiredEntries(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error cleaning up: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Cleaned up %d expired entries.\n", count)
}

func vacuumTables(ctx context.Context) {
	repo := getRepo(ctx)
	defer repo.Close()

	schema := repo.Schema()

	fmt.Println("Running VACUUM ANALYZE...")
	if err := schema.VacuumAndAnalyze(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "Error vacuuming: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("VACUUM ANALYZE completed successfully!")
}

func showStats(ctx context.Context) {
	repo := getRepo(ctx)
	defer repo.Close()

	schema := repo.Schema()

	stats, err := schema.GetTableStats(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting stats: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Table Statistics:")
	fmt.Println("=================")
	for table, stat := range stats {
		fmt.Printf("  %s:\n", table)
		fmt.Printf("    Rows:    %d\n", stat.RowCount)
		fmt.Printf("    Size:    %.2f MB\n", float64(stat.SizeBytes)/(1024*1024))
	}
}
