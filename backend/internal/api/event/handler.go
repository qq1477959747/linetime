package event

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/middleware"
	"github.com/qq1477959747/linetime/backend/internal/pkg/response"
	"github.com/qq1477959747/linetime/backend/internal/service"
)

type Handler struct {
	eventService *service.EventService
}

func NewHandler(eventService *service.EventService) *Handler {
	return &Handler{eventService: eventService}
}

// CreateEvent 创建事件
func (h *Handler) CreateEvent(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	var req service.CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数错误")
		return
	}

	event, err := h.eventService.CreateEvent(&req, userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, event)
}

// GetEventByID 获取事件详情
func (h *Handler) GetEventByID(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "无效的事件ID")
		return
	}

	event, err := h.eventService.GetEventByID(eventID, userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, event)
}

// GetEventsBySpace 获取空间的事件列表
func (h *Handler) GetEventsBySpace(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	spaceID, err := uuid.Parse(c.Param("space_id"))
	if err != nil {
		response.BadRequest(c, "无效的空间ID")
		return
	}

	req := service.QueryEventsRequest{
		SpaceID: spaceID,
	}

	// 解析查询参数
	if startDateStr := c.Query("start_date"); startDateStr != "" {
		startDate, err := time.Parse("2006-01-02", startDateStr)
		if err == nil {
			req.StartDate = &startDate
		}
	}

	if endDateStr := c.Query("end_date"); endDateStr != "" {
		endDate, err := time.Parse("2006-01-02", endDateStr)
		if err == nil {
			req.EndDate = &endDate
		}
	}

	events, err := h.eventService.GetEventsBySpace(&req, userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, events)
}

// UpdateEvent 更新事件
func (h *Handler) UpdateEvent(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "无效的事件ID")
		return
	}

	var req service.UpdateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数错误")
		return
	}

	event, err := h.eventService.UpdateEvent(eventID, userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, event)
}

// DeleteEvent 删除事件
func (h *Handler) DeleteEvent(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "无效的事件ID")
		return
	}

	if err := h.eventService.DeleteEvent(eventID, userID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "删除事件成功", nil)
}
