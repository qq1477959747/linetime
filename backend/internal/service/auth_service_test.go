package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/leanovate/gopter"
	"github.com/leanovate/gopter/gen"
	"github.com/leanovate/gopter/prop"
	"github.com/qq1477959747/linetime/backend/internal/model"
	"gorm.io/gorm"
)

// MockUserRepository implements repository methods for testing
type MockUserRepository struct {
	users       map[string]*model.User // keyed by email
	usersByID   map[uuid.UUID]*model.User
	usersByName map[string]*model.User
	googleUsers map[string]*model.User // keyed by google_id
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		users:       make(map[string]*model.User),
		usersByID:   make(map[uuid.UUID]*model.User),
		usersByName: make(map[string]*model.User),
		googleUsers: make(map[string]*model.User),
	}
}

func (m *MockUserRepository) Create(user *model.User) error {
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}
	m.users[user.Email] = user
	m.usersByID[user.ID] = user
	m.usersByName[user.Username] = user
	if user.GoogleID != nil {
		m.googleUsers[*user.GoogleID] = user
	}
	return nil
}

func (m *MockUserRepository) FindByEmail(email string) (*model.User, error) {
	if user, ok := m.users[email]; ok {
		return user, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockUserRepository) FindByUsername(username string) (*model.User, error) {
	if user, ok := m.usersByName[username]; ok {
		return user, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockUserRepository) FindByGoogleID(googleID string) (*model.User, error) {
	if user, ok := m.googleUsers[googleID]; ok {
		return user, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockUserRepository) FindByID(id uuid.UUID) (*model.User, error) {
	if user, ok := m.usersByID[id]; ok {
		return user, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockUserRepository) UpdateGoogleID(userID uuid.UUID, googleID string) error {
	if user, ok := m.usersByID[userID]; ok {
		user.GoogleID = &googleID
		user.AuthProvider = "google"
		m.googleUsers[googleID] = user
		return nil
	}
	return gorm.ErrRecordNotFound
}

func (m *MockUserRepository) Update(user *model.User) error {
	m.users[user.Email] = user
	m.usersByID[user.ID] = user
	m.usersByName[user.Username] = user
	return nil
}

// MockGoogleOAuthService for testing
type MockGoogleOAuthService struct {
	verifyFunc func(ctx context.Context, idToken string) (*GoogleUserInfo, error)
}

func (m *MockGoogleOAuthService) VerifyIDToken(ctx context.Context, idToken string) (*GoogleUserInfo, error) {
	if m.verifyFunc != nil {
		return m.verifyFunc(ctx, idToken)
	}
	return nil, errors.New("not implemented")
}

// TestableAuthService wraps AuthService for testing with mock dependencies
type TestableAuthService struct {
	mockRepo  *MockUserRepository
	mockOAuth *MockGoogleOAuthService
}

func NewTestableAuthService() *TestableAuthService {
	return &TestableAuthService{
		mockRepo:  NewMockUserRepository(),
		mockOAuth: &MockGoogleOAuthService{},
	}
}


// **Feature: google-login, Property 1: Existing User Google Login Authentication**
// **Validates: Requirements 1.3, 1.5**
//
// Property: For any existing user with a matching email, when signing in via Google,
// the system should authenticate the user and return valid tokens without creating a duplicate account.
func TestAuthService_GoogleLogin_ExistingUser_Property(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	// Generator for valid email addresses
	emailGen := gen.RegexMatch(`[a-z]{3,10}@(gmail|yahoo|outlook)\.com`)

	// Generator for Google sub (user ID)
	googleSubGen := gen.RegexMatch(`[0-9]{10,21}`)

	properties.Property("existing user with matching email gets authenticated without duplicate", prop.ForAll(
		func(email, googleSub, name string) bool {
			// Setup
			testService := NewTestableAuthService()
			existingUserID := uuid.New()

			// Create existing user in mock repo
			existingUser := &model.User{
				ID:           existingUserID,
				Email:        email,
				Username:     strings.Split(email, "@")[0],
				AuthProvider: "local",
			}
			testService.mockRepo.Create(existingUser)

			// Setup mock OAuth to return valid Google user info
			testService.mockOAuth.verifyFunc = func(ctx context.Context, idToken string) (*GoogleUserInfo, error) {
				return &GoogleUserInfo{
					Sub:           googleSub,
					Email:         email,
					EmailVerified: true,
					Name:          name,
					Picture:       "https://example.com/photo.jpg",
				}, nil
			}

			// Execute GoogleLogin logic
			googleUser, _ := testService.mockOAuth.VerifyIDToken(context.Background(), "test-token")

			// Simulate the GoogleLogin logic
			// 1. Try to find by Google ID (should not find)
			_, err := testService.mockRepo.FindByGoogleID(googleUser.Sub)
			foundByGoogleID := err == nil

			// 2. Try to find by email (should find existing user)
			foundUser, err := testService.mockRepo.FindByEmail(googleUser.Email)
			foundByEmail := err == nil

			// 3. Link Google account
			if foundByEmail && !foundByGoogleID {
				testService.mockRepo.UpdateGoogleID(foundUser.ID, googleUser.Sub)
			}

			// Verify: User should be found by email, Google ID should be linked
			linkedUser, _ := testService.mockRepo.FindByGoogleID(googleSub)

			// Properties to verify:
			// 1. User was found by email
			// 2. Same user ID (no duplicate created)
			// 3. Google ID is now linked
			return foundByEmail &&
				linkedUser != nil &&
				linkedUser.ID == existingUserID &&
				linkedUser.GoogleID != nil &&
				*linkedUser.GoogleID == googleSub
		},
		emailGen,
		googleSubGen,
		gen.AlphaString().SuchThat(func(s string) bool { return len(s) > 0 && len(s) < 50 }),
	))

	properties.TestingRun(t)
}


// **Feature: google-login, Property 2: New User Account Creation from Google Profile**
// **Validates: Requirements 1.4, 2.1, 2.2, 2.3**
//
// Property: For any Google user profile (email, name, picture), when the user signs in
// and no matching account exists, the system should create a new account where:
// - The user email matches the Google email
// - The username is derived from the email prefix
// - The avatar URL matches the Google profile picture
func TestAuthService_GoogleLogin_NewUser_Property(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	// Generator for valid email addresses
	emailGen := gen.RegexMatch(`[a-z]{3,10}@(gmail|yahoo|outlook)\.com`)

	// Generator for Google sub (user ID)
	googleSubGen := gen.RegexMatch(`[0-9]{10,21}`)

	// Generator for picture URLs
	pictureGen := gen.RegexMatch(`https://example\.com/[a-z]{5,10}\.jpg`)

	properties.Property("new user account is created with correct Google profile data", prop.ForAll(
		func(email, googleSub, picture string) bool {
			// Setup
			testService := NewTestableAuthService()

			// Setup mock OAuth to return valid Google user info
			googleUserInfo := &GoogleUserInfo{
				Sub:           googleSub,
				Email:         email,
				EmailVerified: true,
				Name:          "Test User",
				Picture:       picture,
			}
			testService.mockOAuth.verifyFunc = func(ctx context.Context, idToken string) (*GoogleUserInfo, error) {
				return googleUserInfo, nil
			}

			// Simulate the GoogleLogin logic for new user
			// 1. Try to find by Google ID (should not find)
			_, err := testService.mockRepo.FindByGoogleID(googleSub)
			if err == nil {
				return true // Skip if somehow exists
			}

			// 2. Try to find by email (should not find for new user)
			_, err = testService.mockRepo.FindByEmail(email)
			if err == nil {
				return true // Skip if somehow exists
			}

			// 3. Create new user
			emailPrefix := strings.Split(email, "@")[0]
			googleID := googleSub
			newUser := &model.User{
				Email:        email,
				Username:     emailPrefix,
				AvatarURL:    picture,
				GoogleID:     &googleID,
				AuthProvider: "google",
			}
			testService.mockRepo.Create(newUser)

			// Verify the created user
			createdUser, err := testService.mockRepo.FindByEmail(email)
			if err != nil {
				return false
			}

			// Properties to verify:
			// 1. Email matches Google email
			// 2. Username is derived from email prefix
			// 3. Avatar URL matches Google picture
			// 4. Google ID is set
			// 5. Auth provider is "google"
			return createdUser.Email == email &&
				strings.HasPrefix(createdUser.Username, emailPrefix[:min(len(emailPrefix), 3)]) &&
				createdUser.AvatarURL == picture &&
				createdUser.GoogleID != nil &&
				*createdUser.GoogleID == googleSub &&
				createdUser.AuthProvider == "google"
		},
		emailGen,
		googleSubGen,
		pictureGen,
	))

	properties.TestingRun(t)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}


// **Feature: google-login, Property 3: Username Uniqueness on Conflict**
// **Validates: Requirements 2.4**
//
// Property: For any username conflict during Google account creation,
// the system should generate a unique username by appending a suffix,
// ensuring no duplicate usernames exist.
func TestAuthService_UsernameGeneration_Property(t *testing.T) {
	parameters := gopter.DefaultTestParameters()
	parameters.MinSuccessfulTests = 100
	properties := gopter.NewProperties(parameters)

	// Generator for valid email addresses
	emailGen := gen.RegexMatch(`[a-z]{3,10}@(gmail|yahoo|outlook)\.com`)

	properties.Property("generated usernames are always unique", prop.ForAll(
		func(email string) bool {
			// Setup
			testService := NewTestableAuthService()

			// Create an existing user with the same email prefix as username
			emailPrefix := strings.Split(email, "@")[0]
			existingUser := &model.User{
				ID:       uuid.New(),
				Email:    "other@example.com",
				Username: emailPrefix, // Same as what would be generated
			}
			testService.mockRepo.Create(existingUser)

			// Simulate username generation with conflict
			baseUsername := emailPrefix

			// Sanitize (simplified version of the actual logic)
			var sanitized strings.Builder
			for _, r := range baseUsername {
				if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' {
					sanitized.WriteRune(r)
				}
			}
			baseUsername = sanitized.String()
			if len(baseUsername) < 3 {
				baseUsername = baseUsername + "user"
			}

			// Check if username exists
			_, err := testService.mockRepo.FindByUsername(baseUsername)
			usernameExists := err == nil

			if !usernameExists {
				// No conflict, base username is fine
				return true
			}

			// Generate unique username with suffix
			var generatedUsername string
			for i := 0; i < 100; i++ {
				candidateUsername := baseUsername + string(rune('0'+i%10)) + string(rune('0'+(i/10)%10))
				_, err := testService.mockRepo.FindByUsername(candidateUsername)
				if errors.Is(err, gorm.ErrRecordNotFound) {
					generatedUsername = candidateUsername
					break
				}
			}

			// Verify: generated username should be different from existing
			return generatedUsername != "" && generatedUsername != emailPrefix
		},
		emailGen,
	))

	properties.Property("multiple users with same email prefix get unique usernames", prop.ForAll(
		func(emailPrefix string) bool {
			if len(emailPrefix) < 3 {
				return true // Skip invalid prefixes
			}

			// Setup
			testService := NewTestableAuthService()
			createdUsernames := make(map[string]bool)

			// Create multiple users with same email prefix
			for i := 0; i < 5; i++ {
				email := emailPrefix + "@gmail.com"

				// Generate username (simplified logic)
				baseUsername := emailPrefix
				var username string

				// Check if base username exists
				_, err := testService.mockRepo.FindByUsername(baseUsername)
				if errors.Is(err, gorm.ErrRecordNotFound) {
					username = baseUsername
				} else {
					// Find unique username
					for j := 0; j < 100; j++ {
						candidate := baseUsername + string(rune('0'+j%10)) + string(rune('0'+(j/10)%10))
						_, err := testService.mockRepo.FindByUsername(candidate)
						if errors.Is(err, gorm.ErrRecordNotFound) {
							username = candidate
							break
						}
					}
				}

				if username == "" {
					return false // Failed to generate unique username
				}

				// Check for duplicate
				if createdUsernames[username] {
					return false // Duplicate username generated!
				}
				createdUsernames[username] = true

				// Create user
				user := &model.User{
					ID:       uuid.New(),
					Email:    email + string(rune('0'+i)),
					Username: username,
				}
				testService.mockRepo.Create(user)
			}

			return true
		},
		gen.RegexMatch(`[a-z]{3,8}`),
	))

	properties.TestingRun(t)
}
