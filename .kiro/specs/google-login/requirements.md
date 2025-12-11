# Requirements Document

## Introduction

本功能为 LineTime 应用添加 Google OAuth 2.0 登录支持，允许用户使用 Google 账号快速登录或注册。该功能将与现有的用户名/密码认证系统并存，为用户提供更便捷的登录方式。

## Glossary

- **Google OAuth 2.0**: Google 提供的开放授权协议，允许第三方应用获取用户授权访问其 Google 账户信息
- **ID Token**: Google 返回的 JWT 令牌，包含用户身份信息（邮箱、姓名、头像等）
- **OAuth Provider**: 第三方认证提供商，本功能中指 Google
- **LineTime System**: 本应用的后端系统
- **Access Token**: 系统内部使用的 JWT 访问令牌
- **Refresh Token**: 用于刷新 Access Token 的令牌

## Requirements

### Requirement 1

**User Story:** As a user, I want to sign in with my Google account, so that I can quickly access the application without creating a new password.

#### Acceptance Criteria

1. WHEN a user clicks the Google sign-in button THEN the LineTime System SHALL redirect the user to Google OAuth consent screen
2. WHEN Google returns an authorization code THEN the LineTime System SHALL exchange the code for user identity information
3. WHEN a user with an existing account (matching email) signs in via Google THEN the LineTime System SHALL link the Google account and authenticate the user
4. WHEN a new user signs in via Google THEN the LineTime System SHALL create a new account using Google profile information
5. WHEN Google authentication succeeds THEN the LineTime System SHALL issue Access Token and Refresh Token to the user
6. IF Google authentication fails THEN the LineTime System SHALL display an appropriate error message to the user

### Requirement 2

**User Story:** As a user, I want my Google profile information to be used for my account, so that I don't need to manually fill in my details.

#### Acceptance Criteria

1. WHEN a new account is created via Google sign-in THEN the LineTime System SHALL use the Google email as the user email
2. WHEN a new account is created via Google sign-in THEN the LineTime System SHALL generate a unique username from the Google email prefix
3. WHEN a new account is created via Google sign-in THEN the LineTime System SHALL use the Google profile picture as the user avatar
4. WHEN a username conflict occurs during account creation THEN the LineTime System SHALL append a random suffix to ensure uniqueness

### Requirement 3

**User Story:** As a developer, I want the Google OAuth credentials to be securely configured, so that the authentication flow is secure.

#### Acceptance Criteria

1. WHILE the application is running THEN the LineTime System SHALL load Google OAuth credentials from environment variables
2. WHEN processing Google ID Token THEN the LineTime System SHALL verify the token signature and claims
3. WHEN verifying Google ID Token THEN the LineTime System SHALL validate the token audience matches the configured client ID
4. IF the Google ID Token is invalid or expired THEN the LineTime System SHALL reject the authentication request

### Requirement 4

**User Story:** As a user, I want a seamless sign-in experience, so that I can quickly access my account.

#### Acceptance Criteria

1. WHEN Google sign-in completes successfully THEN the LineTime System SHALL redirect the user to their default space or space list
2. WHEN Google sign-in is in progress THEN the LineTime System SHALL display a loading indicator
3. WHEN the user is already logged in THEN the LineTime System SHALL redirect away from the login page
4. WHEN Google sign-in popup is blocked THEN the LineTime System SHALL display guidance to enable popups

