package model

import (
	"encoding/json"
	"time"
)

// PasswordResetToken represents a password reset verification token stored in Redis
type PasswordResetToken struct {
	Email     string    `json:"email"`
	Code      string    `json:"code"`
	Attempts  int       `json:"attempts"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

// NewPasswordResetToken creates a new password reset token with default expiration
func NewPasswordResetToken(email, code string) *PasswordResetToken {
	now := time.Now()
	return &PasswordResetToken{
		Email:     email,
		Code:      code,
		Attempts:  0,
		CreatedAt: now,
		ExpiresAt: now.Add(10 * time.Minute),
	}
}

// ToJSON serializes the token to JSON bytes
func (t *PasswordResetToken) ToJSON() ([]byte, error) {
	return json.Marshal(t)
}

// FromJSON deserializes JSON bytes to a PasswordResetToken
func FromJSON(data []byte) (*PasswordResetToken, error) {
	var token PasswordResetToken
	if err := json.Unmarshal(data, &token); err != nil {
		return nil, err
	}
	return &token, nil
}

// IsExpired checks if the token has expired
func (t *PasswordResetToken) IsExpired() bool {
	return time.Now().After(t.ExpiresAt)
}

// HasTooManyAttempts checks if the token has exceeded max attempts (5)
func (t *PasswordResetToken) HasTooManyAttempts() bool {
	return t.Attempts >= 5
}

// IncrementAttempts increases the attempt counter
func (t *PasswordResetToken) IncrementAttempts() {
	t.Attempts++
}

// IsValid checks if the provided code matches and token is still valid
func (t *PasswordResetToken) IsValid(code string) bool {
	return t.Code == code && !t.IsExpired() && !t.HasTooManyAttempts()
}
