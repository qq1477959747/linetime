package service

import (
	"context"
	"errors"
	"fmt"

	"google.golang.org/api/idtoken"
)

// GoogleOAuthService handles Google OAuth token verification
type GoogleOAuthService struct {
	clientID string
}

// GoogleUserInfo contains user information extracted from Google ID Token
type GoogleUserInfo struct {
	Sub           string `json:"sub"`            // Google 用户唯一 ID
	Email         string `json:"email"`          // 用户邮箱
	EmailVerified bool   `json:"email_verified"` // 邮箱是否已验证
	Name          string `json:"name"`           // 用户姓名
	Picture       string `json:"picture"`        // 头像 URL
}

// NewGoogleOAuthService creates a new GoogleOAuthService instance
func NewGoogleOAuthService(clientID string) *GoogleOAuthService {
	return &GoogleOAuthService{
		clientID: clientID,
	}
}

// VerifyIDToken verifies a Google ID Token and returns user information
// It validates:
// - Token signature using Google's public keys
// - Token audience matches the configured client ID
// - Token is not expired
func (s *GoogleOAuthService) VerifyIDToken(ctx context.Context, idToken string) (*GoogleUserInfo, error) {
	if idToken == "" {
		return nil, errors.New("ID Token 不能为空")
	}

	if s.clientID == "" {
		return nil, errors.New("Google Client ID 未配置")
	}

	// Validate the ID token using Google's idtoken library
	// This automatically:
	// - Fetches Google's public keys
	// - Verifies the JWT signature
	// - Validates the audience (aud) claim
	// - Checks token expiration
	payload, err := idtoken.Validate(ctx, idToken, s.clientID)
	if err != nil {
		return nil, fmt.Errorf("Google 认证失败：%w", err)
	}

	// Extract user information from claims
	userInfo := &GoogleUserInfo{}

	if sub, ok := payload.Claims["sub"].(string); ok {
		userInfo.Sub = sub
	} else {
		return nil, errors.New("无效的 ID Token：缺少 sub 字段")
	}

	if email, ok := payload.Claims["email"].(string); ok {
		userInfo.Email = email
	}

	if emailVerified, ok := payload.Claims["email_verified"].(bool); ok {
		userInfo.EmailVerified = emailVerified
	}

	if name, ok := payload.Claims["name"].(string); ok {
		userInfo.Name = name
	}

	if picture, ok := payload.Claims["picture"].(string); ok {
		userInfo.Picture = picture
	}

	return userInfo, nil
}
