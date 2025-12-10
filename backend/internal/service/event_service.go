package service

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/model"
	"github.com/qq1477959747/linetime/backend/internal/repository"
)

type EventService struct {
	eventRepo *repository.EventRepository
	spaceRepo *repository.SpaceRepository
}

func NewEventService(eventRepo *repository.EventRepository, spaceRepo *repository.SpaceRepository) *EventService {
	return &EventService{
		eventRepo: eventRepo,
		spaceRepo: spaceRepo,
	}
}

type CreateEventRequest struct {
	SpaceID   uuid.UUID          `json:"space_id" binding:"required"`
	EventDate time.Time          `json:"event_date" binding:"required"`
	EventTime *time.Time         `json:"event_time"`
	Title     string             `json:"title"`
	Content   string             `json:"content"`
	Images    []EventImageUpload `json:"images"`
}

type EventImageUpload struct {
	ImageURL     string `json:"image_url" binding:"required"`
	ThumbnailURL string `json:"thumbnail_url" binding:"required"`
	SortOrder    int    `json:"sort_order"`
}

type UpdateEventRequest struct {
	EventDate *time.Time `json:"event_date"`
	EventTime *time.Time `json:"event_time"`
	Title     *string    `json:"title"`
	Content   *string    `json:"content"`
}

type QueryEventsRequest struct {
	SpaceID   uuid.UUID  `json:"space_id"`
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
	Limit     int        `json:"limit"`
	Offset    int        `json:"offset"`
}

// CreateEvent 创建事件
func (s *EventService) CreateEvent(req *CreateEventRequest, userID uuid.UUID) (*model.Event, error) {
	// 检查用户是否在该空间
	isMember, err := s.spaceRepo.IsUserInSpace(req.SpaceID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("您不在该空间中，无法创建事件")
	}

	// 创建事件
	event := &model.Event{
		SpaceID:   req.SpaceID,
		UserID:    userID,
		EventDate: req.EventDate,
		EventTime: req.EventTime,
		Title:     req.Title,
		Content:   req.Content,
	}

	if err := s.eventRepo.Create(event); err != nil {
		return nil, err
	}

	// 添加图片
	if len(req.Images) > 0 {
		images := make([]model.EventImage, 0, len(req.Images))
		for i, img := range req.Images {
			images = append(images, model.EventImage{
				EventID:      event.ID,
				ImageURL:     img.ImageURL,
				ThumbnailURL: img.ThumbnailURL,
				SortOrder:    i, // 如果没有指定 SortOrder，使用索引
			})
		}
		if err := s.eventRepo.AddImages(images); err != nil {
			return nil, err
		}
	}

	// 重新查询完整的事件数据
	return s.eventRepo.FindByID(event.ID)
}

// GetEventByID 获取事件详情
func (s *EventService) GetEventByID(eventID, userID uuid.UUID) (*model.Event, error) {
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return nil, err
	}

	// 检查用户是否有权限查看
	isMember, err := s.spaceRepo.IsUserInSpace(event.SpaceID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("无权访问该事件")
	}

	return event, nil
}

// GetEventsBySpace 获取空间的事件列表
func (s *EventService) GetEventsBySpace(req *QueryEventsRequest, userID uuid.UUID) ([]model.Event, error) {
	// 检查用户是否在该空间
	isMember, err := s.spaceRepo.IsUserInSpace(req.SpaceID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("无权访问该空间")
	}

	// 如果指定了日期范围，使用日期范围查询
	if req.StartDate != nil && req.EndDate != nil {
		return s.eventRepo.FindByDateRange(req.SpaceID, *req.StartDate, *req.EndDate)
	}

	// 否则使用分页查询
	limit := req.Limit
	if limit == 0 {
		limit = 50 // 默认返回 50 条
	}
	return s.eventRepo.FindBySpaceID(req.SpaceID, limit, req.Offset)
}

// UpdateEvent 更新事件
func (s *EventService) UpdateEvent(eventID, userID uuid.UUID, req *UpdateEventRequest) (*model.Event, error) {
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return nil, err
	}

	// 检查权限（只有创建者可以修改）
	if event.UserID != userID {
		return nil, errors.New("只有创建者可以修改事件")
	}

	// 更新字段
	if req.EventDate != nil {
		event.EventDate = *req.EventDate
	}
	if req.EventTime != nil {
		event.EventTime = req.EventTime
	}
	if req.Title != nil {
		event.Title = *req.Title
	}
	if req.Content != nil {
		event.Content = *req.Content
	}

	if err := s.eventRepo.Update(event); err != nil {
		return nil, err
	}

	return s.eventRepo.FindByID(eventID)
}

// DeleteEvent 删除事件
func (s *EventService) DeleteEvent(eventID, userID uuid.UUID) error {
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return err
	}

	// 检查权限（只有创建者或空间 owner 可以删除）
	if event.UserID != userID {
		// 检查是否是空间 owner
		space, err := s.spaceRepo.FindByID(event.SpaceID)
		if err != nil {
			return err
		}
		if space.OwnerID != userID {
			return errors.New("只有创建者或空间创建者可以删除事件")
		}
	}

	return s.eventRepo.Delete(eventID)
}

// DeleteEventImage 删除事件图片
func (s *EventService) DeleteEventImage(imageID, userID uuid.UUID) error {
	// TODO: 需要先查询图片所属的事件，检查权限
	return s.eventRepo.DeleteImage(imageID)
}
