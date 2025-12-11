package service

import (
	"context"
	"strings"
	"testing"

	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
)

// **Feature: google-login, Property 4: ID Token Validation**
// **Validates: Requirements 3.2, 3.3, 3.4**
//
// Property: For any Google ID Token submitted for authentication:
// - Valid tokens with correct audience should be accepted
// - Invalid, expired, or wrong-audience tokens should be rejected with an error
//
// Since we cannot generate valid Google-signed tokens in tests, we test that:
// 1. Empty tokens are rejected
// 2. Malformed tokens are rejected
// 3. Random string tokens are rejected
// 4. Service without clientID configured rejects all tokens
func TestGoogleOAuthService_VerifyIDToken_Property(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	// Property: Empty tokens should always be rejected
	properties.Property("empty tokens are rejected", prop.ForAll(
		func(clientID string) bool {
			service := NewGoogleOAuthService(clientID)
			_, err := service.VerifyIDToken(context.Background(), "")
			return err != nil && strings.Contains(err.Error(), "ID Token 不能为空")
		},
		gen.AnyString(),
	))

	// Property: Service without clientID should reject all tokens
	properties.Property("unconfigured clientID rejects all tokens", prop.ForAll(
		func(token string) bool {
			if token == "" {
				return true // Skip empty tokens, covered by other property
			}
			service := NewGoogleOAuthService("")
			_, err := service.VerifyIDToken(context.Background(), token)
			return err != nil && strings.Contains(err.Error(), "Google Client ID 未配置")
		},
		gen.AnyString(),
	))

	// Property: Random/malformed tokens should be rejected
	// (Google's idtoken.Validate will reject any token that isn't properly signed)
	properties.Property("malformed tokens are rejected", prop.ForAll(
		func(token string, clientID string) bool {
			if token == "" || clientID == "" {
				return true // Skip cases covered by other properties
			}
			service := NewGoogleOAuthService(clientID)
			_, err := service.VerifyIDToken(context.Background(), token)
			// Any random string should fail validation
			return err != nil
		},
		gen.AnyString().SuchThat(func(s string) bool { return len(s) > 0 }),
		gen.AnyString().SuchThat(func(s string) bool { return len(s) > 0 }),
	))

	// Property: JWT-like but invalid tokens should be rejected
	properties.Property("fake JWT tokens are rejected", prop.ForAll(
		func(header, payload, signature string) bool {
			// Generate a fake JWT-like token
			fakeToken := header + "." + payload + "." + signature
			service := NewGoogleOAuthService("test-client-id")
			_, err := service.VerifyIDToken(context.Background(), fakeToken)
			// Should fail because signature won't verify against Google's keys
			return err != nil
		},
		gen.AlphaString(),
		gen.AlphaString(),
		gen.AlphaString(),
	))

	properties.TestingRun(t)
}

// Unit test for basic validation behavior
func TestGoogleOAuthService_VerifyIDToken_EmptyToken(t *testing.T) {
	service := NewGoogleOAuthService("test-client-id")
	_, err := service.VerifyIDToken(context.Background(), "")
	if err == nil {
		t.Error("Expected error for empty token, got nil")
	}
	if !strings.Contains(err.Error(), "ID Token 不能为空") {
		t.Errorf("Expected error message about empty token, got: %s", err.Error())
	}
}

func TestGoogleOAuthService_VerifyIDToken_NoClientID(t *testing.T) {
	service := NewGoogleOAuthService("")
	_, err := service.VerifyIDToken(context.Background(), "some-token")
	if err == nil {
		t.Error("Expected error for unconfigured client ID, got nil")
	}
	if !strings.Contains(err.Error(), "Google Client ID 未配置") {
		t.Errorf("Expected error message about unconfigured client ID, got: %s", err.Error())
	}
}
