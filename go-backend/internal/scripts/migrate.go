package main

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

func createMigrationFiles(name string) error {
	// Points to your "db/migrations" directory relative to your terminal execution path
	dir := "internal/database/migrations"
	_ = os.MkdirAll(dir, os.ModePerm)

	// Formats a clean year-month-day-hour-minute-second sequence string
	timestamp := time.Now().Format("20060102150405")

	upFile := filepath.Join(dir, fmt.Sprintf("%s_%s.up.sql", timestamp, name))
	downFile := filepath.Join(dir, fmt.Sprintf("%s_%s.down.sql", timestamp, name))

	if err := os.WriteFile(upFile, []byte("-- Write Up Migration SQL Here\n"), 0644); err != nil {
		return err
	}
	if err := os.WriteFile(downFile, []byte("-- Write Down Migration SQL Here\n"), 0644); err != nil {
		return err
	}

	fmt.Printf("Created: %s\nCreated: %s\n", upFile, downFile)
	return nil
}

func main() {
	// Change "create_users_table" here if you want to name your next migration file differently!
	err := createMigrationFiles("create_users_table")
	if err != nil {
		fmt.Printf("Failed to generate migration assets: %v\n", err)
		os.Exit(1)
	}
}
