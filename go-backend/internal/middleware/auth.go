package middleware

import (
	"context"
	"strings"

	"encoding/json"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type CachedUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

func AuthMiddleware(redisClient *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		// If there's no token, it might be a public request (like Login).
		// We let it pass through to GraphQL without injecting a user.
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			// If they tried to provide a token but formatted it wrong, we can let it pass
			// or stop it. Let's let it pass; the resolver will notice the user is missing.
			c.Next()
			return
		}
		accessToken := parts[1]

		redisKey := fmt.Sprintf("auth:%s", accessToken)
		sessionJSON, err := redisClient.Get(c.Request.Context(), redisKey).Result()

		if err == nil {
			var user CachedUser
			if err := json.Unmarshal([]byte(sessionJSON), &user); err == nil {
				// Success! Inject the authenticated user into the Go context stream
				ctx := context.WithValue(c.Request.Context(), "currentUser", user)
				c.Request = c.Request.WithContext(ctx)
			}
		}

		c.Next()
	}
}
