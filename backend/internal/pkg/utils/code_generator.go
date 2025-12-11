package utils

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
)

// GenerateVerificationCode generates a cryptographically secure 6-digit verification code
func GenerateVerificationCode() (string, error) {
	// Generate a random number between 0 and 999999
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	// Format as 6-digit string with leading zeros
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// MaskEmail masks an email address for display (e.g., "t***@example.com")
func MaskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return email
	}

	local := parts[0]
	domain := parts[1]

	if len(local) == 0 {
		return email
	}

	// Keep first character, mask the rest with ***
	if len(local) == 1 {
		return local + "***@" + domain
	}

	return string(local[0]) + "***@" + domain
}
