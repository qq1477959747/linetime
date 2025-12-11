# Requirements Document

## Introduction

本功能为 LineTime 应用提供密码重置和修改密码能力。用户可以通过邮箱验证码重置忘记的密码，或在已登录状态下修改当前密码。系统需要确保密码操作的安全性，包括验证码有效期限制、密码强度验证等。

## Glossary

- **User**: 系统中的注册用户实体，包含邮箱、用户名、密码哈希等信息
- **Password_Reset_Token**: 用于验证密码重置请求的临时令牌，包含验证码和过期时间
- **Verification_Code**: 发送到用户邮箱的6位数字验证码
- **Password_Hash**: 使用 bcrypt 算法加密后的密码存储值
- **Auth_Provider**: 用户认证方式，可为 'local'（本地密码）或 'google'（Google OAuth）

## Requirements

### Requirement 1

**User Story:** As a user, I want to reset my forgotten password via email verification, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user requests password reset with a registered email THEN the System SHALL generate a 6-digit verification code and send it to the email address
2. WHEN a user submits a valid verification code within 10 minutes THEN the System SHALL allow the user to set a new password
3. WHEN a user submits an expired verification code THEN the System SHALL reject the request and prompt the user to request a new code
4. WHEN a user submits an incorrect verification code 5 times THEN the System SHALL invalidate the current code and require a new request
5. IF a user requests password reset for a Google-only account THEN the System SHALL inform the user to use Google login instead

### Requirement 2

**User Story:** As a logged-in user, I want to change my current password, so that I can maintain account security.

#### Acceptance Criteria

1. WHEN a logged-in user provides correct current password and valid new password THEN the System SHALL update the password hash
2. WHEN a logged-in user provides incorrect current password THEN the System SHALL reject the change request
3. WHEN a logged-in user provides a new password that does not meet strength requirements THEN the System SHALL reject the request with specific feedback
4. IF a Google-only user attempts to change password THEN the System SHALL prompt the user to set an initial password first

### Requirement 3

**User Story:** As a system administrator, I want password operations to be secure, so that user accounts are protected from unauthorized access.

#### Acceptance Criteria

1. WHILE storing passwords THEN the System SHALL use bcrypt hashing with default cost factor
2. WHEN validating new passwords THEN the System SHALL require minimum 8 characters with at least one letter and one number
3. WHEN a password is successfully reset or changed THEN the System SHALL invalidate all existing verification codes for that user
4. WHEN generating verification codes THEN the System SHALL use cryptographically secure random number generation

### Requirement 4

**User Story:** As a user, I want clear feedback during password operations, so that I understand the status and any errors.

#### Acceptance Criteria

1. WHEN a password reset email is sent THEN the System SHALL display a confirmation message with masked email address
2. WHEN a verification code is invalid or expired THEN the System SHALL display a specific error message
3. WHEN a password change succeeds THEN the System SHALL display a success message and optionally redirect to login
4. WHEN rate limiting is triggered THEN the System SHALL inform the user of the wait time before retry

### Requirement 5

**User Story:** As a developer, I want the password reset token to be serialized and deserialized correctly, so that the system can store and retrieve tokens reliably.

#### Acceptance Criteria

1. WHEN storing a password reset token THEN the System SHALL serialize it to JSON format
2. WHEN retrieving a password reset token THEN the System SHALL deserialize it from JSON and reconstruct the token object
3. WHEN serializing then deserializing a token THEN the System SHALL produce an equivalent token object
