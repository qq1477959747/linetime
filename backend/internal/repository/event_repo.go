package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/model"
	"gorm.io/gorm"
)

type EventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) Create(event *model.Event) error {
	return r.db.Create(event).Error
}

func (r *EventRepository) FindByID(id uuid.UUID) (*model.Event, error) {
	var event model.Event
	err := r.db.
		Preload("User").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Where("id = ?", id).
		First(&event).Error
	return &event, err
}

func (r *EventRepository) FindBySpaceID(spaceID uuid.UUID, limit, offset int) ([]model.Event, error) {
	var events []model.Event
	err := r.db.
		Where("space_id = ?", spaceID).
		Preload("User").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Order("event_date DESC, event_time DESC").
		Limit(limit).
		Offset(offset).
		Find(&events).Error
	return events, err
}

func (r *EventRepository) FindByDateRange(spaceID uuid.UUID, startDate, endDate time.Time) ([]model.Event, error) {
	var events []model.Event
	err := r.db.
		Where("space_id = ? AND event_date >= ? AND event_date <= ?", spaceID, startDate, endDate).
		Preload("User").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Order("event_date DESC, event_time DESC").
		Find(&events).Error
	return events, err
}

func (r *EventRepository) Update(event *model.Event) error {
	return r.db.Save(event).Error
}

func (r *EventRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Event{}, id).Error
}

// EventImage 相关操作

func (r *EventRepository) AddImages(images []model.EventImage) error {
	return r.db.Create(&images).Error
}

func (r *EventRepository) DeleteImage(id uuid.UUID) error {
	return r.db.Delete(&model.EventImage{}, id).Error
}

func (r *EventRepository) FindImagesByEventID(eventID uuid.UUID) ([]model.EventImage, error) {
	var images []model.EventImage
	err := r.db.Where("event_id = ?", eventID).Order("sort_order ASC").Find(&images).Error
	return images, err
}
