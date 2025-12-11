package repository

import (
	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/model"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByID(id uuid.UUID) (*model.User, error) {
	var user model.User
	err := r.db.Where("id = ?", id).First(&user).Error
	return &user, err
}

func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *UserRepository) FindByUsername(username string) (*model.User, error) {
	var user model.User
	err := r.db.Where("username = ?", username).First(&user).Error
	return &user, err
}

func (r *UserRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.User{}, id).Error
}

// UpdateDefaultSpace sets the default space for a user
func (r *UserRepository) UpdateDefaultSpace(userID, spaceID uuid.UUID) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("default_space_id", spaceID).Error
}

// ClearDefaultSpace removes the default space setting for a user
func (r *UserRepository) ClearDefaultSpace(userID uuid.UUID) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("default_space_id", nil).Error
}

// ClearDefaultSpaceForSpace clears default_space_id for all users who have the given space as default
func (r *UserRepository) ClearDefaultSpaceForSpace(spaceID uuid.UUID) error {
	return r.db.Model(&model.User{}).Where("default_space_id = ?", spaceID).Update("default_space_id", nil).Error
}

// FindByGoogleID finds a user by their Google ID
func (r *UserRepository) FindByGoogleID(googleID string) (*model.User, error) {
	var user model.User
	err := r.db.Where("google_id = ?", googleID).First(&user).Error
	return &user, err
}

// UpdateGoogleID links a Google account to an existing user
func (r *UserRepository) UpdateGoogleID(userID uuid.UUID, googleID string) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"google_id":     googleID,
		"auth_provider": "google",
	}).Error
}

// UpdatePassword updates the password hash for a user
func (r *UserRepository) UpdatePassword(userID uuid.UUID, passwordHash string) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("password_hash", passwordHash).Error
}
