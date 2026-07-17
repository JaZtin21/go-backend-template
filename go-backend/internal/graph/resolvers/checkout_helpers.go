package graph

import (
	"context"
	"errors"

	"go-backend/internal/middleware"

	"github.com/99designs/gqlgen/graphql"
	pgx "github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

type checkoutInventoryRow struct {
	ID            string
	ItemName      string
	CostPrice     float64
	SellingPrice  float64
	StockQuantity int
}

func ensureCheckoutOwnership(ctx context.Context, db *pgxpool.Pool, shopID string) (middleware.CachedUser, error) {
	currentUser := ctx.Value("currentUser").(middleware.CachedUser)

	var shopOwnerID string
	err := db.QueryRow(ctx, "SELECT owner_id FROM shops WHERE id = $1 LIMIT 1", shopID).Scan(&shopOwnerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			graphql.AddError(ctx, &gqlerror.Error{
				Message:    "not found: target shop resource does not exist",
				Extensions: map[string]interface{}{"code": "NOT_FOUND"},
			})
			return middleware.CachedUser{}, nil
		}

		graphql.AddError(ctx, &gqlerror.Error{
			Message:    "internal server error: ownership confirmation failure",
			Extensions: map[string]interface{}{"code": "INTERNAL_SERVER_ERROR"},
		})
		return middleware.CachedUser{}, nil
	}

	if shopOwnerID != currentUser.ID {
		graphql.AddError(ctx, &gqlerror.Error{
			Message:    "forbidden: access denied to modify this shop",
			Extensions: map[string]interface{}{"code": "FORBIDDEN"},
		})
		return middleware.CachedUser{}, nil
	}

	return currentUser, nil
}
