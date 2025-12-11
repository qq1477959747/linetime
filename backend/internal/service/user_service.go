package service

import (
	"errors"

	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/model"
	"github.com/qq1477959747/linetime/backend/internal/repository"
)

type UserService struct {
	userRepo  *repository.UserRepository
	spaceRepo *repository.SpaceRepository
}

func NewUserService(userRepo *repository.UserRepository, spaceRepo *repository.SpaceRepository) *UserService {
	return &UserService{
		userRepo:  userRepo,
		spaceRepo: spaceRepo,
	}
}

// SetDefaultSpace sets the default space for a user after validating membership
func (s *UserService) SetDefaultSpace(userID, spaceID uuid.UUID) error {
	// Check if space exists
	_, err := s.spaceRepo.FindByID(spaceID)
	if err != nil {
		return errors.New("空间不存在")
	}

	// Check if user is a member of the space
	isMember, err := s.spaceRepo.IsUserInSpace(spaceID, userID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("您不是该空间的成员")
	}

	// Update default space
	return s.userRepo.UpdateDefaultSpace(userID, spaceID)
}

// ClearDefaultSpace removes the default space setting for a user
func (s *UserService) ClearDefaultSpace(userID uuid.UUID) error {
	return s.userRepo.ClearDefaultSpace(userID)
}

// GetUserByID returns a user by ID
func (s *UserService) GetUserByID(userID uuid.UUID) (*model.User, error) {
	return s.userRepo.FindByID(userID)
}

// ClearDefaultSpaceForSpace clears default space for all users when a space is deleted or user is removed
func (s *UserService) ClearDefaultSpaceForSpace(spaceID uuid.UUID) error {
	return s.userRepo.ClearDefaultSpaceForSpace(spaceID)
}
