package repository

import (
	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/model"
	"gorm.io/gorm"
)

type SpaceRepository struct {
	db *gorm.DB
}

func NewSpaceRepository(db *gorm.DB) *SpaceRepository {
	return &SpaceRepository{db: db}
}

func (r *SpaceRepository) Create(space *model.Space) error {
	return r.db.Create(space).Error
}

func (r *SpaceRepository) FindByID(id uuid.UUID) (*model.Space, error) {
	var space model.Space
	err := r.db.Preload("Owner").Preload("Members.User").Where("id = ?", id).First(&space).Error
	return &space, err
}

func (r *SpaceRepository) FindByInviteCode(code string) (*model.Space, error) {
	var space model.Space
	err := r.db.Where("invite_code = ?", code).First(&space).Error
	return &space, err
}

func (r *SpaceRepository) FindByUserID(userID uuid.UUID) ([]model.Space, error) {
	var spaces []model.Space
	err := r.db.
		Joins("JOIN space_members ON space_members.space_id = spaces.id").
		Where("space_members.user_id = ?", userID).
		Preload("Owner").
		Find(&spaces).Error
	return spaces, err
}

func (r *SpaceRepository) Update(space *model.Space) error {
	return r.db.Save(space).Error
}

func (r *SpaceRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Space{}, id).Error
}

// SpaceMember 相关操作

func (r *SpaceRepository) AddMember(member *model.SpaceMember) error {
	return r.db.Create(member).Error
}

func (r *SpaceRepository) RemoveMember(spaceID, userID uuid.UUID) error {
	return r.db.Where("space_id = ? AND user_id = ?", spaceID, userID).Delete(&model.SpaceMember{}).Error
}

func (r *SpaceRepository) FindMember(spaceID, userID uuid.UUID) (*model.SpaceMember, error) {
	var member model.SpaceMember
	err := r.db.Where("space_id = ? AND user_id = ?", spaceID, userID).First(&member).Error
	return &member, err
}

func (r *SpaceRepository) GetMembers(spaceID uuid.UUID) ([]model.SpaceMember, error) {
	var members []model.SpaceMember
	err := r.db.Where("space_id = ?", spaceID).Preload("User").Find(&members).Error
	return members, err
}

func (r *SpaceRepository) IsUserInSpace(spaceID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&model.SpaceMember{}).
		Where("space_id = ? AND user_id = ?", spaceID, userID).
		Count(&count).Error
	return count > 0, err
}
