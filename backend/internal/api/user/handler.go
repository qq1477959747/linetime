package user

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/pkg/response"
	"github.com/qq1477959747/linetime/backend/internal/service"
)

type Handler struct {
	userService *service.UserService
}

func NewHandler(userService *service.UserService) *Handler {
	return &Handler{userService: userService}
}

type SetDefaultSpaceRequest struct {
	SpaceID string `json:"space_id" binding:"required"`
}

// SetDefaultSpace handles PUT /api/users/default-space
func (h *Handler) SetDefaultSpace(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "未授权")
		return
	}

	var req SetDefaultSpaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	spaceID, err := uuid.Parse(req.SpaceID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "无效的空间 ID")
		return
	}

	err = h.userService.SetDefaultSpace(userID.(uuid.UUID), spaceID)
	if err != nil {
		if err.Error() == "空间不存在" {
			response.Error(c, http.StatusNotFound, err.Error())
			return
		}
		if err.Error() == "您不是该空间的成员" {
			response.Error(c, http.StatusForbidden, err.Error())
			return
		}
		response.Error(c, http.StatusInternalServerError, "设置默认空间失败")
		return
	}

	response.Success(c, gin.H{"default_space_id": req.SpaceID})
}

// ClearDefaultSpace handles DELETE /api/users/default-space
func (h *Handler) ClearDefaultSpace(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "未授权")
		return
	}

	err := h.userService.ClearDefaultSpace(userID.(uuid.UUID))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "清除默认空间失败")
		return
	}

	response.Success(c, nil)
}
