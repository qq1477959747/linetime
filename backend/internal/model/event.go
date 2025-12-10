package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Event struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	SpaceID   uuid.UUID      `gorm:"type:uuid;not null;index:idx_space_date,priority:1" json:"space_id"`
	UserID    uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	EventDate time.Time      `gorm:"type:date;not null;index:idx_space_date,priority:2" json:"event_date"`
	EventTime *time.Time     `gorm:"type:time" json:"event_time"`
	Title     string         `gorm:"type:varchar(200)" json:"title"`
	Content   string         `gorm:"type:text" json:"content"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Space  Space        `gorm:"foreignKey:SpaceID" json:"space,omitempty"`
	User   User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Images []EventImage `gorm:"foreignKey:EventID" json:"images,omitempty"`
}

func (e *Event) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}
