package database

import (
	"context"
	"errors"
	"time"

	"go-backend/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo struct {
	Pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) *UserRepo {
	return &UserRepo{Pool: pool}
}

func (r *UserRepo) FindOrCreateUser(ctx context.Context, u *model.User) (*model.User, error) {
	var existing model.User

	// 1. Check if the user already exists using their unique Google Sub ID
	queryFind := `SELECT id, first_name, last_name, email, profile_photo, created_at, updated_at 
	              FROM users WHERE id = $1 LIMIT 1`

	err := r.Pool.QueryRow(ctx, queryFind, u.ID).Scan(
		&existing.ID, &existing.FirstName, &existing.LastName,
		&existing.Email, &existing.ProfilePhoto, &existing.CreatedAt, &existing.UpdatedAt,
	)

	// 2. If the user was found successfully, return their profile record straight to Go
	if err == nil {
		return &existing, nil
	}

	// 🌟 FIXED: Use errors.Is with pgx.ErrNoRows natively instead of standard database/sql types
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	// 4. The user does not exist yet! Build the time variables for registration
	now := time.Now()
	u.CreatedAt = now
	u.UpdatedAt = now

	// 5. Execute an INSERT statement to write their Google profile data into PostgreSQL
	queryInsert := `INSERT INTO users (id, first_name, last_name, email, profile_photo, created_at, updated_at) 
	                VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err = r.Pool.Exec(ctx, queryInsert, u.ID, u.FirstName, u.LastName, u.Email, u.ProfilePhoto, u.CreatedAt, u.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return u, nil
}
