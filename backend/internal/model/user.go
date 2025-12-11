package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID             uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	Email          string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	Username       string         `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	PasswordHash   string         `gorm:"type:varchar(255)" json:"-"`
	AvatarURL      string         `gorm:"type:text" json:"avatar_url"`
	DefaultSpaceID *uuid.UUID     `gorm:"type:uuid;index" json:"default_space_id"`
	GoogleID       *string        `gorm:"type:varchar(255);uniqueIndex" json:"-"`
	AuthProvider   string         `gorm:"type:varchar(20);default:'local'" json:"auth_provider"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
