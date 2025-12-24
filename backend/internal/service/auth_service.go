package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/model"
	"github.com/qq1477959747/linetime/backend/internal/pkg/jwt"
	"github.com/qq1477959747/linetime/backend/internal/pkg/utils"
	"github.com/qq1477959747/linetime/backend/internal/pkg/validator"
	"github.com/qq1477959747/linetime/backend/internal/repository"
	"github.com/qq1477959747/linetime/backend/internal/storage"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	loginCodeKeyPrefix     = "login_code:"
	loginCodeRateLimitKey  = "login_code_rate:"
	loginCodeTTL           = 5 * time.Minute
	loginCodeRateLimitTTL  = 1 * time.Minute
	loginCodeMaxAttempts   = 5
)

type AuthService struct {
	userRepo    *repository.UserRepository
	emailSender EmailSender
}

func NewAuthService(userRepo *repository.UserRepository, emailSender EmailSender) *AuthService {
	return &AuthService{
		userRepo:    userRepo,
		emailSender: emailSender,
	}
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required"`
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginRequest struct {
	Username string `json:"username"` // 用户名或邮箱
	Password string `json:"password" binding:"required"`
}

type EmailLoginCodeRequest struct {
	Email string `json:"email" binding:"required"`
}

type EmailLoginRequest struct {
	Email string `json:"email" binding:"required"`
	Code  string `json:"code" binding:"required"`
}

type AuthResponse struct {
	User         *model.User `json:"user"`
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	ExpiresIn    int         `json:"expires_in"`
}

func (s *AuthService) Register(req *RegisterRequest) (*AuthResponse, error) {
	// 验证邮箱格式
	if !validator.IsValidEmail(req.Email) {
		return nil, errors.New("邮箱格式不正确")
	}

	// 验证邮箱域名是否在白名单中
	if !validator.IsAllowedEmailDomain(req.Email) {
		return nil, errors.New("请使用常用邮箱注册(如 QQ、163、Gmail 等)")
	}

	// 验证用户名
	if !validator.IsValidUsername(req.Username) {
		return nil, errors.New("用户名长度必须在3-50个字符之间")
	}

	// 验证密码强度
	if !validator.IsValidPassword(req.Password) {
		return nil, errors.New("密码必须至少8位，包含字母和数字")
	}

	// 检查邮箱是否已存在
	_, err := s.userRepo.FindByEmail(req.Email)
	if err == nil {
		return nil, errors.New("邮箱已被注册")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// 检查用户名是否已存在
	_, err = s.userRepo.FindByUsername(req.Username)
	if err == nil {
		return nil, errors.New("用户名已被使用")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 创建用户
	user := &model.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// 生成 Token
	accessToken, err := jwt.GenerateAccessToken(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	refreshToken, err := jwt.GenerateRefreshToken(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    7200, // 2小时
	}, nil
}

func (s *AuthService) Login(req *LoginRequest) (*AuthResponse, error) {
	// 查找用户（支持用户名或邮箱）
	var user *model.User
	var err error

	// 先尝试用户名查找
	user, err = s.userRepo.FindByUsername(req.Username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 如果用户名找不到，尝试邮箱查找
			user, err = s.userRepo.FindByEmail(req.Username)
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return nil, errors.New("用户名或密码错误")
				}
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	// 验证密码
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errors.New("用户名或密码错误")
	}

	// 生成 Token
	accessToken, err := jwt.GenerateAccessToken(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	refreshToken, err := jwt.GenerateRefreshToken(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    7200,
	}, nil
}

func (s *AuthService) GetUserByID(userID uuid.UUID) (*model.User, error) {
	return s.userRepo.FindByID(userID)
}


// SendLoginCode sends a verification code to the user's email for login
func (s *AuthService) SendLoginCode(ctx context.Context, req *EmailLoginCodeRequest) (string, error) {
	// Validate email format
	if !validator.IsValidEmail(req.Email) {
		return "", errors.New("邮箱格式不正确")
	}

	// Check rate limiting
	rateLimitKey := loginCodeRateLimitKey + req.Email
	exists, err := storage.Exists(ctx, rateLimitKey)
	if err != nil {
		return "", fmt.Errorf("检查请求频率失败: %w", err)
	}
	if exists {
		ttl, _ := storage.TTL(ctx, rateLimitKey)
		return "", fmt.Errorf("请求过于频繁，请 %d 秒后重试", int(ttl.Seconds()))
	}

	// Find user by email
	_, err = s.userRepo.FindByEmail(req.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("该邮箱未注册")
		}
		return "", err
	}

	// Generate verification code
	code, err := utils.GenerateVerificationCode()
	if err != nil {
		return "", fmt.Errorf("生成验证码失败: %w", err)
	}

	// Create and store token
	token := model.NewPasswordResetToken(req.Email, code)
	tokenJSON, err := token.ToJSON()
	if err != nil {
		return "", fmt.Errorf("序列化令牌失败: %w", err)
	}

	tokenKey := loginCodeKeyPrefix + req.Email
	if err := storage.Set(ctx, tokenKey, string(tokenJSON), loginCodeTTL); err != nil {
		return "", fmt.Errorf("存储验证码失败: %w", err)
	}

	// Set rate limit
	if err := storage.Set(ctx, rateLimitKey, "1", loginCodeRateLimitTTL); err != nil {
		// Non-critical error, continue
	}

	// Send email
	if err := s.emailSender.SendLoginCode(req.Email, code); err != nil {
		// Delete token if email fails
		storage.Delete(ctx, tokenKey)
		return "", err
	}

	// Return masked email
	return utils.MaskEmail(req.Email), nil
}

// LoginWithCode verifies the code and logs in the user
func (s *AuthService) LoginWithCode(ctx context.Context, req *EmailLoginRequest) (*AuthResponse, error) {
	// Validate email format
	if !validator.IsValidEmail(req.Email) {
		return nil, errors.New("邮箱格式不正确")
	}

	// Get token from storage
	tokenKey := loginCodeKeyPrefix + req.Email
	tokenJSON, err := storage.Get(ctx, tokenKey)
	if err != nil {
		return nil, errors.New("验证码已过期，请重新获取")
	}

	// Parse token
	token, err := model.FromJSON([]byte(tokenJSON))
	if err != nil {
		return nil, errors.New("验证码无效")
	}

	// Check if expired
	if token.IsExpired() {
		storage.Delete(ctx, tokenKey)
		return nil, errors.New("验证码已过期，请重新获取")
	}

	// Check attempts
	if token.HasTooManyAttempts() {
		storage.Delete(ctx, tokenKey)
		return nil, errors.New("尝试次数过多，请重新获取验证码")
	}

	// Verify code
	if token.Code != req.Code {
		// Increment attempts and save
		token.IncrementAttempts()
		updatedJSON, _ := token.ToJSON()
		ttl, _ := storage.TTL(ctx, tokenKey)
		storage.Set(ctx, tokenKey, string(updatedJSON), ttl)
		return nil, errors.New("验证码错误")
	}

	// Find user
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, errors.New("用户不存在")
	}

	// Delete token after successful login
	storage.Delete(ctx, tokenKey)

	// Generate tokens
	accessToken, err := jwt.GenerateAccessToken(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	refreshToken, err := jwt.GenerateRefreshToken(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    7200,
	}, nil
}
