package main

import (
	"fmt"
	"log"

	"github.com/qq1477959747/linetime/backend/config"
	"github.com/qq1477959747/linetime/backend/internal/api"
	"github.com/qq1477959747/linetime/backend/internal/database"
	"github.com/qq1477959747/linetime/backend/internal/storage"
)

func main() {
	// 加载配置
	config.Load()
	log.Println("配置加载完成")

	// 初始化数据库
	if err := database.InitDB(); err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	log.Println("数据库初始化完成")

	// 初始化 Redis
	if err := storage.InitRedis(); err != nil {
		log.Fatalf("Redis 初始化失败: %v", err)
	}
	log.Println("Redis 初始化完成")

	// 设置路由
	router := api.SetupRouter(database.GetDB())

	// 启动服务器
	addr := fmt.Sprintf(":%s", config.AppConfig.Server.Port)
	log.Printf("服务器启动在 %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
