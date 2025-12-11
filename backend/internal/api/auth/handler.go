package auth

import (
	"github.com/gin-gonic/gin"
	"github.com/qq1477959747/linetime/backend/internal/middleware"
	"github.com/qq1477959747/linetime/backend/internal/pkg/response"
	"github.com/qq1477959747/linetime/backend/internal/service"
)

type Handler struct {
	authService          *service.AuthService
	passwordResetService *service.PasswordResetService
}

func NewHandler(authService *service.AuthService, passwordResetService *service.PasswordResetService) *Handler {
	return &Handler{
		authService:          authService,
		passwordResetService: passwordResetService,
	}
}

func (h *Handler) Register(c *gin.Context) {
	var req service.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数错误")
		return
	}

	authResp, err := h.authService.Register(&req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, authResp)
}

func (h *Handler) Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数错误")
		return
	}

	authResp, err := h.authService.Login(&req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, authResp)
}

func (h *Handler) GetMe(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		response.NotFound(c, "用户不存在")
		return
	}

	response.Success(c, user)
}

func (h *Handler) GoogleLogin(c *gin.Context) {
	var req service.GoogleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数错误")
		return
	}

	authResp, err := h.authService.GoogleLogin(c.Request.Context(), &req)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, authResp)
}

// ForgotPasswordRequest represents the forgot password request body
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ForgotPassword handles POST /api/auth/forgot-password
func (h *Handler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请输入有效的邮箱地址")
		return
	}

	maskedEmail, err := h.passwordResetService.RequestPasswordReset(c.Request.Context(), req.Email)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"message":      "验证码已发送",
		"masked_email": maskedEmail,
	})
}

// ResetPasswordRequest represents the reset password request body
type ResetPasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Code        string `json:"code" binding:"required,len=6"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

// ResetPassword handles POST /api/auth/reset-password
func (h *Handler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数错误")
		return
	}

	err := h.passwordResetService.VerifyAndResetPassword(c.Request.Context(), req.Email, req.Code, req.NewPassword)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "密码重置成功"})
}

// ChangePasswordRequest represents the change password request body
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

// ChangePassword handles POST /api/auth/change-password
func (h *Handler) ChangePassword(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数错误")
		return
	}

	err := h.passwordResetService.ChangePassword(c.Request.Context(), userID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "密码修改成功"})
}

// SetInitialPasswordRequest represents the set initial password request body
type SetInitialPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

// SetInitialPassword handles POST /api/auth/set-password (for Google users)
func (h *Handler) SetInitialPassword(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		response.Unauthorized(c, "未授权")
		return
	}

	var req SetInitialPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请求参数错误")
		return
	}

	err := h.passwordResetService.SetInitialPassword(c.Request.Context(), userID, req.NewPassword)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "密码设置成功"})
}
