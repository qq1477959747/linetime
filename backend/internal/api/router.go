package api

import (
	"github.com/gin-gonic/gin"
	"github.com/qq1477959747/linetime/backend/internal/api/auth"
	"github.com/qq1477959747/linetime/backend/internal/middleware"
	"github.com/qq1477959747/linetime/backend/internal/repository"
	"github.com/qq1477959747/linetime/backend/internal/service"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	// 中间件
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.LoggerMiddleware())

	// 健康检查
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// API v1
	v1 := r.Group("/api")
	{
		// 认证路由
		authGroup := v1.Group("/auth")
		{
			userRepo := repository.NewUserRepository(db)
			authService := service.NewAuthService(userRepo)
			authHandler := auth.NewHandler(authService)

			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
			authGroup.GET("/me", middleware.AuthMiddleware(), authHandler.GetMe)
		}

		// TODO: 添加其他模块路由
		// spacesGroup := v1.Group("/spaces", middleware.AuthMiddleware())
		// eventsGroup := v1.Group("/events", middleware.AuthMiddleware())
		// uploadGroup := v1.Group("/upload", middleware.AuthMiddleware())
	}

	return r
}
