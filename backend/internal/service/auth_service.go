package service

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/model"
	"github.com/qq1477959747/linetime/backend/internal/pkg/jwt"
	"github.com/qq1477959747/linetime/backend/internal/pkg/validator"
	"github.com/qq1477959747/linetime/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	userRepo           *repository.UserRepository
	googleOAuthService *GoogleOAuthService
}

func NewAuthService(userRepo *repository.UserRepository, googleOAuthService *GoogleOAuthService) *AuthService {
	return &AuthService{
		userRepo:           userRepo,
		googleOAuthService: googleOAuthService,
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

type GoogleLoginRequest struct {
	IDToken string `json:"id_token" binding:"required"`
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

// GoogleLogin handles Google OAuth login
// It verifies the ID token, finds or creates a user, and returns auth tokens
func (s *AuthService) GoogleLogin(ctx context.Context, req *GoogleLoginRequest) (*AuthResponse, error) {
	// Verify the Google ID Token
	googleUser, err := s.googleOAuthService.VerifyIDToken(ctx, req.IDToken)
	if err != nil {
		return nil, fmt.Errorf("Google 认证失败：%w", err)
	}

	// Check if email is verified
	if !googleUser.EmailVerified {
		return nil, errors.New("请使用已验证的 Google 邮箱")
	}

	var user *model.User

	// Try to find user by Google ID first
	user, err = s.userRepo.FindByGoogleID(googleUser.Sub)
	if err == nil {
		// User found by Google ID, return tokens
		return s.generateAuthResponse(user)
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Try to find user by email (existing user linking Google account)
	user, err = s.userRepo.FindByEmail(googleUser.Email)
	if err == nil {
		// Link Google account to existing user
		if err := s.userRepo.UpdateGoogleID(user.ID, googleUser.Sub); err != nil {
			return nil, fmt.Errorf("关联 Google 账号失败：%w", err)
		}
		user.GoogleID = &googleUser.Sub
		user.AuthProvider = "google"
		return s.generateAuthResponse(user)
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Create new user from Google profile
	username := s.generateUsernameFromEmail(googleUser.Email)
	googleID := googleUser.Sub

	user = &model.User{
		Email:        googleUser.Email,
		Username:     username,
		AvatarURL:    googleUser.Picture,
		GoogleID:     &googleID,
		AuthProvider: "google",
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, fmt.Errorf("创建用户失败：%w", err)
	}

	return s.generateAuthResponse(user)
}

// generateUsernameFromEmail generates a unique username from email prefix
// If the username already exists, it appends a random suffix
func (s *AuthService) generateUsernameFromEmail(email string) string {
	// Extract prefix from email
	parts := strings.Split(email, "@")
	baseUsername := parts[0]

	// Sanitize username (keep only alphanumeric and underscore)
	var sanitized strings.Builder
	for _, r := range baseUsername {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' {
			sanitized.WriteRune(r)
		}
	}
	baseUsername = sanitized.String()

	// Ensure minimum length
	if len(baseUsername) < 3 {
		baseUsername = baseUsername + "user"
	}

	// Truncate if too long (leave room for suffix)
	if len(baseUsername) > 40 {
		baseUsername = baseUsername[:40]
	}

	// Check if username exists
	_, err := s.userRepo.FindByUsername(baseUsername)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return baseUsername
	}

	// Username exists, append random suffix
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := 0; i < 10; i++ {
		suffix := fmt.Sprintf("%04d", rng.Intn(10000))
		candidateUsername := baseUsername + suffix
		if len(candidateUsername) > 50 {
			candidateUsername = baseUsername[:50-len(suffix)] + suffix
		}
		_, err := s.userRepo.FindByUsername(candidateUsername)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return candidateUsername
		}
	}

	// Fallback: use UUID-based username
	return fmt.Sprintf("user_%s", uuid.New().String()[:8])
}

// generateAuthResponse creates an AuthResponse with tokens for the given user
func (s *AuthService) generateAuthResponse(user *model.User) (*AuthResponse, error) {
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
