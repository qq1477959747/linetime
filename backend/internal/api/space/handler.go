package space

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/middleware"
	"github.com/qq1477959747/linetime/backend/internal/pkg/response"
	"github.com/qq1477959747/linetime/backend/internal/service"
)

type Handler struct {
	spaceService *service.SpaceService
}

func NewHandler(spaceService *service.SpaceService) *Handler {
	return &Handler{spaceService: spaceService}
}

// CreateSpace 创建空间
func (h *Handler) CreateSpace(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	var req service.CreateSpaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数错误")
		return
	}

	space, err := h.spaceService.CreateSpace(&req, userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, space)
}

// GetUserSpaces 获取用户的所有空间
func (h *Handler) GetUserSpaces(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	spaces, err := h.spaceService.GetUserSpaces(userID)
	if err != nil {
		response.InternalServerError(c, "获取空间列表失败")
		return
	}

	response.Success(c, spaces)
}

// GetSpaceByID 获取空间详情
func (h *Handler) GetSpaceByID(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "无效的空间ID")
		return
	}

	space, err := h.spaceService.GetSpaceByID(spaceID, userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, space)
}

// RefreshInviteCode 刷新邀请码
func (h *Handler) RefreshInviteCode(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "无效的空间ID")
		return
	}

	space, err := h.spaceService.RefreshInviteCode(spaceID, userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"invite_code": space.InviteCode,
		"invite_link": space.InviteLink,
	})
}

// JoinSpace 加入空间
func (h *Handler) JoinSpace(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	inviteCode := c.Param("code")
	if inviteCode == "" {
		response.BadRequest(c, "邀请码不能为空")
		return
	}

	space, err := h.spaceService.JoinSpace(inviteCode, userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, space)
}

// RemoveMember 移除成员
func (h *Handler) RemoveMember(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "无效的空间ID")
		return
	}

	targetUserID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		response.BadRequest(c, "无效的用户ID")
		return
	}

	if err := h.spaceService.RemoveMember(spaceID, userID, targetUserID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "移除成员成功", nil)
}

// GetSpaceMembers 获取空间成员列表
func (h *Handler) GetSpaceMembers(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	spaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "无效的空间ID")
		return
	}

	members, err := h.spaceService.GetSpaceMembers(spaceID, userID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	// 转换为前端期望的格式
	type MemberResponse struct {
		UserID   string `json:"user_id"`
		Username string `json:"username"`
		Email    string `json:"email"`
		Avatar   string `json:"avatar,omitempty"`
		Role     string `json:"role"`
		JoinedAt string `json:"joined_at"`
	}

	var memberResponses []MemberResponse
	for _, member := range members {
		memberResponses = append(memberResponses, MemberResponse{
			UserID:   member.UserID.String(),
			Username: member.User.Username,
			Email:    member.User.Email,
			Avatar:   member.User.AvatarURL,
			Role:     string(member.Role),
			JoinedAt: member.JoinedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	response.Success(c, memberResponses)
}
