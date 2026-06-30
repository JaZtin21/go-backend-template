package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// ConnectRedis initializes and validates the Redis client connection.
func ConnectRedis(addr string, password string, db int) (*redis.Client, error) {
	// 1. Configure the native Redis client options
	client := redis.NewClient(&redis.Options{
		Addr:     addr,     // Your Redis address (e.g., "localhost:6379")
		Password: password, // Your Redis password (use "" if no password)
		DB:       db,       // Your Redis database index (use 0 for default)
	})

	// 2. Enforce a 3-second strict time passport for the network ping
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	// 3. Ping Redis live over the network using the semicolon short-assignment shortcut!
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("unable to connect to redis: %w", err)
	}

	fmt.Println("Successfully connected to Redis cache layer!")

	// 4. Return the active client memory pointer and a null placeholder error
	return client, nil
}
