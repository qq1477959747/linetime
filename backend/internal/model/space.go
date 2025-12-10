package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SpaceType string

const (
	SpaceTypePersonal SpaceType = "personal"
	SpaceTypeCouple   SpaceType = "couple"
	SpaceTypeGroup    SpaceType = "group"
)

type Space struct {
	ID         uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	Name       string         `gorm:"type:varchar(100);not null" json:"name"`
	InviteCode string         `gorm:"type:varchar(8);uniqueIndex;not null" json:"invite_code"`
	InviteLink string         `gorm:"type:text;not null" json:"invite_link"`
	OwnerID    uuid.UUID      `gorm:"type:uuid;not null;index" json:"owner_id"`
	Type       SpaceType      `gorm:"type:varchar(20);not null" json:"type"`
	CreatedAt  time.Time      `json:"created_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Owner   User          `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Members []SpaceMember `gorm:"foreignKey:SpaceID" json:"members,omitempty"`
}

func (s *Space) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
