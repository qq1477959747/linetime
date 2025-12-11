package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/model"
	"github.com/qq1477959747/linetime/backend/internal/pkg/utils"
	"github.com/qq1477959747/linetime/backend/internal/pkg/validator"
	"github.com/qq1477959747/linetime/backend/internal/repository"
	"github.com/qq1477959747/linetime/backend/internal/storage"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	passwordResetKeyPrefix = "password_reset:"
	rateLimitKeyPrefix     = "password_reset_rate:"
	tokenTTL               = 10 * time.Minute
	rateLimitTTL           = 1 * time.Minute
	maxAttempts            = 5
)

type PasswordResetService struct {
	userRepo    *repository.UserRepository
	emailSender EmailSender
}

func NewPasswordResetService(userRepo *repository.UserRepository, emailSender EmailSender) *PasswordResetService {
	return &PasswordResetService{
		userRepo:    userRepo,
		emailSender: emailSender,
	}
}

// RequestPasswordReset generates and sends a verification code to the user's email
func (s *PasswordResetService) RequestPasswordReset(ctx context.Context, email string) (string, error) {
	// Check rate limiting
	rateLimitKey := rateLimitKeyPrefix + email
	exists, err := storage.Exists(ctx, rateLimitKey)
	if err != nil {
		return "", fmt.Errorf("检查请求频率失败: %w", err)
	}
	if exists {
		ttl, _ := storage.TTL(ctx, rateLimitKey)
		return "", fmt.Errorf("请求过于频繁，请 %d 秒后重试", int(ttl.Seconds()))
	}

	// Find user by email
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("该邮箱未注册")
		}
		return "", err
	}

	// Check if user is Google-only (no password set)
	if user.AuthProvider == "google" && user.PasswordHash == "" {
		return "", errors.New("该账户使用 Google 登录，请使用 Google 登录")
	}

	// Generate verification code
	code, err := utils.GenerateVerificationCode()
	if err != nil {
		return "", fmt.Errorf("生成验证码失败: %w", err)
	}

	// Create and store token
	token := model.NewPasswordResetToken(email, code)
	tokenJSON, err := token.ToJSON()
	if err != nil {
		return "", fmt.Errorf("序列化令牌失败: %w", err)
	}

	tokenKey := passwordResetKeyPrefix + email
	if err := storage.Set(ctx, tokenKey, string(tokenJSON), tokenTTL); err != nil {
		return "", fmt.Errorf("存储验证码失败: %w", err)
	}

	// Set rate limit
	if err := storage.Set(ctx, rateLimitKey, "1", rateLimitTTL); err != nil {
		// Non-critical error, continue
	}

	// Send email
	if err := s.emailSender.SendVerificationCode(email, code); err != nil {
		// Delete token if email fails
		storage.Delete(ctx, tokenKey)
		return "", err
	}

	// Return masked email
	return utils.MaskEmail(email), nil
}


// VerifyAndResetPassword verifies the code and updates the user's password
func (s *PasswordResetService) VerifyAndResetPassword(ctx context.Context, email, code, newPassword string) error {
	// Validate new password
	if !validator.IsValidPassword(newPassword) {
		return errors.New("密码必须至少8位，包含字母和数字")
	}

	// Get token from Redis
	tokenKey := passwordResetKeyPrefix + email
	tokenJSON, err := storage.Get(ctx, tokenKey)
	if err != nil {
		return errors.New("验证码已过期，请重新获取")
	}

	// Parse token
	token, err := model.FromJSON([]byte(tokenJSON))
	if err != nil {
		return errors.New("验证码无效")
	}

	// Check if expired
	if token.IsExpired() {
		storage.Delete(ctx, tokenKey)
		return errors.New("验证码已过期，请重新获取")
	}

	// Check attempts
	if token.HasTooManyAttempts() {
		storage.Delete(ctx, tokenKey)
		return errors.New("尝试次数过多，请重新获取验证码")
	}

	// Verify code
	if token.Code != code {
		// Increment attempts and save
		token.IncrementAttempts()
		updatedJSON, _ := token.ToJSON()
		ttl, _ := storage.TTL(ctx, tokenKey)
		storage.Set(ctx, tokenKey, string(updatedJSON), ttl)
		return errors.New("验证码错误")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("密码加密失败: %w", err)
	}

	// Update user password
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return errors.New("用户不存在")
	}

	if err := s.userRepo.UpdatePassword(user.ID, string(hashedPassword)); err != nil {
		return fmt.Errorf("更新密码失败: %w", err)
	}

	// Delete token
	storage.Delete(ctx, tokenKey)

	return nil
}

// ChangePassword changes the password for a logged-in user
func (s *PasswordResetService) ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("用户不存在")
	}

	// Check if user has a password (not Google-only)
	if user.PasswordHash == "" {
		return errors.New("您尚未设置密码，请先设置密码")
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return errors.New("当前密码错误")
	}

	// Validate new password
	if !validator.IsValidPassword(newPassword) {
		return errors.New("密码必须至少8位，包含字母和数字")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("密码加密失败: %w", err)
	}

	// Update password
	if err := s.userRepo.UpdatePassword(userID, string(hashedPassword)); err != nil {
		return fmt.Errorf("更新密码失败: %w", err)
	}

	// Invalidate any existing password reset tokens
	tokenKey := passwordResetKeyPrefix + user.Email
	storage.Delete(ctx, tokenKey)

	return nil
}

// SetInitialPassword sets a password for a Google-only user
func (s *PasswordResetService) SetInitialPassword(ctx context.Context, userID uuid.UUID, newPassword string) error {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("用户不存在")
	}

	// Check if user already has a password
	if user.PasswordHash != "" {
		return errors.New("您已设置密码，请使用修改密码功能")
	}

	// Validate new password
	if !validator.IsValidPassword(newPassword) {
		return errors.New("密码必须至少8位，包含字母和数字")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("密码加密失败: %w", err)
	}

	// Update password and auth provider
	if err := s.userRepo.UpdatePassword(userID, string(hashedPassword)); err != nil {
		return fmt.Errorf("设置密码失败: %w", err)
	}

	return nil
}
