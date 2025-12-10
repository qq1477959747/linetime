package database

import (
	"fmt"
	"log"

	"github.com/qq1477959747/linetime/backend/config"
	"github.com/qq1477959747/linetime/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() error {
	cfg := config.AppConfig.Database

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("连接数据库失败: %w", err)
	}

	log.Println("数据库连接成功")

	// 自动迁移
	if err := AutoMigrate(); err != nil {
		return fmt.Errorf("数据库迁移失败: %w", err)
	}

	return nil
}

func AutoMigrate() error {
	log.Println("开始数据库迁移...")

	err := DB.AutoMigrate(
		&model.User{},
		&model.Space{},
		&model.SpaceMember{},
		&model.Event{},
		&model.EventImage{},
	)

	if err != nil {
		return err
	}

	log.Println("数据库迁移完成")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}
