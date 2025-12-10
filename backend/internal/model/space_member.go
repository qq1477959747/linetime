package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MemberRole string

const (
	MemberRoleOwner  MemberRole = "owner"
	MemberRoleMember MemberRole = "member"
)

type SpaceMember struct {
	ID       uuid.UUID  `gorm:"type:uuid;primary_key;" json:"id"`
	SpaceID  uuid.UUID  `gorm:"type:uuid;not null;index:idx_space_user,priority:1" json:"space_id"`
	UserID   uuid.UUID  `gorm:"type:uuid;not null;index:idx_space_user,priority:2;index:idx_user" json:"user_id"`
	Role     MemberRole `gorm:"type:varchar(20);not null" json:"role"`
	JoinedAt time.Time  `json:"joined_at"`

	// 关联
	Space Space `gorm:"foreignKey:SpaceID" json:"space,omitempty"`
	User  User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (sm *SpaceMember) BeforeCreate(tx *gorm.DB) error {
	if sm.ID == uuid.Nil {
		sm.ID = uuid.New()
	}
	if sm.JoinedAt.IsZero() {
		sm.JoinedAt = time.Now()
	}
	return nil
}
