package database

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-migrate/migrate/v4"
	pgxmigrate "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
)

func ConnectPostgres(connString string) (*pgxpool.Pool, error) {
	// 1. Create a baseline configuration object from our connection string
	config, err := pgxpool.ParseConfig(connString)

	if err != nil {
		return nil, fmt.Errorf("unable to parse database config: %w", err)
	}

	// 2. Tweak pool settings for performance
	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnIdleTime = 30 * time.Minute

	// 3. Establish the connection pool background worker with a 5-second timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// 4. Ping the database to guarantee it is alive
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	// 5. AUTOMATIC MIGRATION LAYER RUNNER
	// We run the migration execution right here using your active connection context
	if err := runDatabaseMigrations(pool); err != nil {
		return nil, fmt.Errorf("database migration auto-sync failed: %w", err)
	}

	fmt.Println("Successfully connected to PostgreSQL connection pool!")
	return pool, nil
}

func runDatabaseMigrations(pool *pgxpool.Pool) error {
	// Convert the modern pgx connection configuration object out of the background standard library
	db := stdlib.OpenDB(*pool.Config().ConnConfig)
	defer db.Close()

	// Initialize the custom golang-migrate driver wrapping the standard connection instance
	driver, err := pgxmigrate.WithInstance(db, &pgxmigrate.Config{})
	if err != nil {
		return fmt.Errorf("could not create pgx migration driver instance: %w", err)
	}

	// Target the specific directory location path where your script files sit relative to execution root
	m, err := migrate.NewWithDatabaseInstance(
		"file://./internal/database/migrations",
		"postgres",
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to map migration asset folder registry: %w", err)
	}

	fmt.Println("Verifying database schema updates...")

	// Execute the migration sync code!
	// ErrNoChange means your database is already fully synchronized, which we safely bypass
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("an execution error occurred while processing scripts: %w", err)
	}

	fmt.Println("Database schemas completely verified and up to date! 🎉")
	return nil
}
