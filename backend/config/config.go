package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server      ServerConfig
	Database    DatabaseConfig
	Redis       RedisConfig
	MinIO       MinIOConfig
	JWT         JWTConfig
	Upload      UploadConfig
	GoogleOAuth GoogleOAuthConfig
	SMTP        SMTPConfig
}

type ServerConfig struct {
	Port    string
	GinMode string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Password string
	DB       int
}

type MinIOConfig struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	UseSSL    bool
}

type JWTConfig struct {
	Secret        string
	AccessExpire  time.Duration
	RefreshExpire time.Duration
}

type UploadConfig struct {
	MaxFileSize       int64
	MaxFilesPerUpload int
	AllowedFileTypes  string
}

type GoogleOAuthConfig struct {
	ClientID     string
	ClientSecret string
}

type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

var AppConfig *Config

func Load() {
	// 加载 .env 文件
	if err := godotenv.Load(); err != nil {
		log.Println("未找到 .env 文件，使用环境变量")
	}

	AppConfig = &Config{
		Server: ServerConfig{
			Port:    mustGetEnv("SERVER_PORT"),
			GinMode: mustGetEnv("GIN_MODE"),
		},
		Database: DatabaseConfig{
			Host:     mustGetEnv("DB_HOST"),
			Port:     mustGetEnv("DB_PORT"),
			User:     mustGetEnv("DB_USER"),
			Password: mustGetEnv("DB_PASSWORD"),
			DBName:   mustGetEnv("DB_NAME"),
			SSLMode:  mustGetEnv("DB_SSL_MODE"),
		},
		Redis: RedisConfig{
			Host:     mustGetEnv("REDIS_HOST"),
			Password: getEnv("REDIS_PASSWORD"),
			DB:       mustGetEnvAsInt("REDIS_DB"),
		},
		MinIO: MinIOConfig{
			Endpoint:  mustGetEnv("MINIO_ENDPOINT"),
			AccessKey: mustGetEnv("MINIO_ACCESS_KEY"),
			SecretKey: mustGetEnv("MINIO_SECRET_KEY"),
			Bucket:    mustGetEnv("MINIO_BUCKET"),
			UseSSL:    mustGetEnvAsBool("MINIO_USE_SSL"),
		},
		JWT: JWTConfig{
			Secret:        mustGetEnv("JWT_SECRET"),
			AccessExpire:  mustParseDuration(mustGetEnv("JWT_ACCESS_EXPIRE")),
			RefreshExpire: mustParseDuration(mustGetEnv("JWT_REFRESH_EXPIRE")),
		},
		Upload: UploadConfig{
			MaxFileSize:       mustGetEnvAsInt64("MAX_FILE_SIZE"),
			MaxFilesPerUpload: mustGetEnvAsInt("MAX_FILES_PER_UPLOAD"),
			AllowedFileTypes:  mustGetEnv("ALLOWED_FILE_TYPES"),
		},
		GoogleOAuth: GoogleOAuthConfig{
			ClientID:     getEnv("GOOGLE_CLIENT_ID"),
			ClientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
		},
		SMTP: SMTPConfig{
			Host:     getEnv("SMTP_HOST"),
			Port:     getEnvAsInt("SMTP_PORT", 587),
			Username: getEnv("SMTP_USERNAME"),
			Password: getEnv("SMTP_PASSWORD"),
			From:     getEnv("SMTP_FROM"),
		},
	}
}

func getEnv(key string) string {
	return os.Getenv(key)
}

func mustGetEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("环境变量 %s 未设置", key)
	}
	return value
}

func mustGetEnvAsInt(key string) int {
	valueStr := mustGetEnv(key)
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		log.Fatalf("环境变量 %s 必须是整数: %v", key, err)
	}
	return value
}

func mustGetEnvAsInt64(key string) int64 {
	valueStr := mustGetEnv(key)
	value, err := strconv.ParseInt(valueStr, 10, 64)
	if err != nil {
		log.Fatalf("环境变量 %s 必须是整数: %v", key, err)
	}
	return value
}

func mustGetEnvAsBool(key string) bool {
	valueStr := mustGetEnv(key)
	value, err := strconv.ParseBool(valueStr)
	if err != nil {
		log.Fatalf("环境变量 %s 必须是布尔值: %v", key, err)
	}
	return value
}

func mustParseDuration(s string) time.Duration {
	duration, err := time.ParseDuration(s)
	if err != nil {
		log.Fatalf("解析时间失败: %v", err)
	}
	return duration
}

func getEnvAsInt(key string, defaultVal int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultVal
	}
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultVal
	}
	return value
}

func Validate() error {
	if AppConfig.JWT.Secret == "" {
		return fmt.Errorf("JWT_SECRET 不能为空")
	}
	if AppConfig.Database.Password == "" {
		return fmt.Errorf("DB_PASSWORD 不能为空")
	}
	return nil
}
