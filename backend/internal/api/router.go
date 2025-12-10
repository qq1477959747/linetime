package api

import (
	"github.com/gin-gonic/gin"
	"github.com/qq1477959747/linetime/backend/internal/api/auth"
	"github.com/qq1477959747/linetime/backend/internal/api/event"
	"github.com/qq1477959747/linetime/backend/internal/api/space"
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

		// 空间路由
		spacesGroup := v1.Group("/spaces", middleware.AuthMiddleware())
		{
			spaceRepo := repository.NewSpaceRepository(db)
			spaceService := service.NewSpaceService(spaceRepo)
			spaceHandler := space.NewHandler(spaceService)

			spacesGroup.POST("", spaceHandler.CreateSpace)                     // 创建空间
			spacesGroup.GET("", spaceHandler.GetUserSpaces)                    // 获取用户的所有空间
			spacesGroup.GET("/:id", spaceHandler.GetSpaceByID)                 // 获取空间详情
			spacesGroup.POST("/:id/invite", spaceHandler.RefreshInviteCode)    // 刷新邀请码
			spacesGroup.POST("/join/:code", spaceHandler.JoinSpace)            // 加入空间
			spacesGroup.GET("/:id/members", spaceHandler.GetSpaceMembers)      // 获取空间成员
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

		// TODO: 添加图片上传路由
		// uploadGroup := v1.Group("/upload", middleware.AuthMiddleware())
	}

	return r
}
