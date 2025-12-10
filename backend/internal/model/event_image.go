package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EventImage struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	EventID      uuid.UUID      `gorm:"type:uuid;not null;index:idx_event_sort,priority:1" json:"event_id"`
	ImageURL     string         `gorm:"type:text;not null" json:"image_url"`
	ThumbnailURL string         `gorm:"type:text;not null" json:"thumbnail_url"`
	SortOrder    int            `gorm:"not null;index:idx_event_sort,priority:2" json:"sort_order"`
	UploadedAt   time.Time      `json:"uploaded_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Event Event `gorm:"foreignKey:EventID" json:"event,omitempty"`
}

func (ei *EventImage) BeforeCreate(tx *gorm.DB) error {
	if ei.ID == uuid.Nil {
		ei.ID = uuid.New()
	}
	if ei.UploadedAt.IsZero() {
		ei.UploadedAt = time.Now()
	}
	return nil
}
