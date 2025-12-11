package storage

import (
	"context"
	"time"

	"github.com/qq1477959747/linetime/backend/config"
	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

// InitRedis initializes the Redis client connection
func InitRedis() error {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     config.AppConfig.Redis.Host,
		Password: config.AppConfig.Redis.Password,
		DB:       config.AppConfig.Redis.DB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		return err
	}

	return nil
}

// Set stores a key-value pair with optional TTL
func Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	return RedisClient.Set(ctx, key, value, ttl).Err()
}

// Get retrieves a value by key
func Get(ctx context.Context, key string) (string, error) {
	return RedisClient.Get(ctx, key).Result()
}

// Delete removes a key
func Delete(ctx context.Context, key string) error {
	return RedisClient.Del(ctx, key).Err()
}

// Exists checks if a key exists
func Exists(ctx context.Context, key string) (bool, error) {
	result, err := RedisClient.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return result > 0, nil
}

// TTL returns the remaining time to live of a key
func TTL(ctx context.Context, key string) (time.Duration, error) {
	return RedisClient.TTL(ctx, key).Result()
}
