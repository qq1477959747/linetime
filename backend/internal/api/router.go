package api

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/qq1477959747/linetime/backend/config"
	"github.com/qq1477959747/linetime/backend/internal/api/auth"
	"github.com/qq1477959747/linetime/backend/internal/api/event"
	"github.com/qq1477959747/linetime/backend/internal/api/space"
	"github.com/qq1477959747/linetime/backend/internal/api/upload"
	"github.com/qq1477959747/linetime/backend/internal/api/user"
	"github.com/qq1477959747/linetime/backend/internal/middleware"
	"github.com/qq1477959747/linetime/backend/internal/repository"
	"github.com/qq1477959747/linetime/backend/internal/service"
	"github.com/qq1477959747/linetime/backend/internal/storage"
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
			googleOAuthService := service.NewGoogleOAuthService(config.AppConfig.GoogleOAuth.ClientID)
			authService := service.NewAuthService(userRepo, googleOAuthService)
			emailService := service.NewSMTPEmailService()
			passwordResetService := service.NewPasswordResetService(userRepo, emailService)
			authHandler := auth.NewHandler(authService, passwordResetService)

			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/google", authHandler.GoogleLogin)
			authGroup.GET("/me", middleware.AuthMiddleware(), authHandler.GetMe)
			// Password reset routes
			authGroup.POST("/forgot-password", authHandler.ForgotPassword)
			authGroup.POST("/reset-password", authHandler.ResetPassword)
			authGroup.POST("/change-password", middleware.AuthMiddleware(), authHandler.ChangePassword)
			authGroup.POST("/set-password", middleware.AuthMiddleware(), authHandler.SetInitialPassword)
		}

		// 空间路由
		spacesGroup := v1.Group("/spaces", middleware.AuthMiddleware())
		{
			spaceRepo := repository.NewSpaceRepository(db)
			userRepoForSpace := repository.NewUserRepository(db)
			spaceService := service.NewSpaceService(spaceRepo, userRepoForSpace)
			spaceHandler := space.NewHandler(spaceService)

			spacesGroup.POST("", spaceHandler.CreateSpace)                         // 创建空间
			spacesGroup.GET("", spaceHandler.GetUserSpaces)                        // 获取用户的所有空间
			spacesGroup.GET("/:id", spaceHandler.GetSpaceByID)                     // 获取空间详情
			spacesGroup.DELETE("/:id", spaceHandler.DeleteSpace)                   // 删除空间
			spacesGroup.POST("/:id/invite", spaceHandler.RefreshInviteCode)        // 刷新邀请码
			spacesGroup.POST("/join/:code", spaceHandler.JoinSpace)                // 加入空间
			spacesGroup.GET("/:id/members", spaceHandler.GetSpaceMembers)          // 获取空间成员
			spacesGroup.DELETE("/:id/members/:user_id", spaceHandler.RemoveMember) // 移除成员
		}

		// 事件路由
		eventsGroup := v1.Group("/events", middleware.AuthMiddleware())
		{
			eventRepo := repository.NewEventRepository(db)
			spaceRepo := repository.NewSpaceRepository(db)
			eventService := service.NewEventService(eventRepo, spaceRepo)
			eventHandler := event.NewHandler(eventService)

			eventsGroup.POST("", eventHandler.CreateEvent)                            // 创建事件
			eventsGroup.GET("/:id", eventHandler.GetEventByID)                        // 获取事件详情
			eventsGroup.PUT("/:id", eventHandler.UpdateEvent)                         // 更新事件
			eventsGroup.DELETE("/:id", eventHandler.DeleteEvent)                      // 删除事件
			eventsGroup.GET("/spaces/:space_id", eventHandler.GetEventsBySpace)       // 获取空间事件列表
		}

		// 图片上传路由
		uploadGroup := v1.Group("/upload", middleware.AuthMiddleware())
		{
			minioStorage, err := storage.NewMinIOStorage()
			if err != nil {
				log.Fatalf("初始化 MinIO 存储失败: %v", err)
			}
			uploadService := service.NewUploadService(minioStorage)
			uploadHandler := upload.NewHandler(uploadService)

			uploadGroup.POST("/image", uploadHandler.UploadImage)   // 上传单张图片
			uploadGroup.POST("/images", uploadHandler.UploadImages) // 批量上传图片
		}

		// 用户路由
		usersGroup := v1.Group("/users", middleware.AuthMiddleware())
		{
			userRepo := repository.NewUserRepository(db)
			spaceRepo := repository.NewSpaceRepository(db)
			userService := service.NewUserService(userRepo, spaceRepo)
			userHandler := user.NewHandler(userService)

			usersGroup.PUT("/default-space", userHandler.SetDefaultSpace)      // 设置默认空间
			usersGroup.DELETE("/default-space", userHandler.ClearDefaultSpace) // 清除默认空间
		}
	}

	return r
}
