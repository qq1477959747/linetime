package service

import (
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"github.com/qq1477959747/linetime/backend/internal/model"
	"github.com/qq1477959747/linetime/backend/internal/repository"
	"gorm.io/gorm"
)

type SpaceService struct {
	spaceRepo *repository.SpaceRepository
}

func NewSpaceService(spaceRepo *repository.SpaceRepository) *SpaceService {
	return &SpaceService{spaceRepo: spaceRepo}
}

type CreateSpaceRequest struct {
	Name        string          `json:"name" binding:"required"`
	Description string          `json:"description"`
	Type        model.SpaceType `json:"type"`
}

type JoinSpaceRequest struct {
	InviteCode string `json:"invite_code" binding:"required"`
}

type SpaceResponse struct {
	*model.Space
	MemberCount int `json:"member_count"`
}

// GenerateInviteCode 生成8位随机邀请码
func GenerateInviteCode() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const codeLength = 8

	rand.Seed(time.Now().UnixNano())
	code := make([]byte, codeLength)
	for i := range code {
		code[i] = charset[rand.Intn(len(charset))]
	}
	return string(code)
}

// CreateSpace 创建空间并自动添加创建者为 owner
func (s *SpaceService) CreateSpace(req *CreateSpaceRequest, ownerID uuid.UUID) (*model.Space, error) {
	// 如果没有指定类型，默认为 personal
	if req.Type == "" {
		req.Type = model.SpaceTypePersonal
	}

	// 验证空间类型
	if req.Type != model.SpaceTypePersonal && req.Type != model.SpaceTypeCouple && req.Type != model.SpaceTypeGroup {
		return nil, errors.New("无效的空间类型")
	}

	// 生成唯一的邀请码
	inviteCode := GenerateInviteCode()
	// TODO: 检查邀请码是否重复，如果重复则重新生成

	// 创建空间
	space := &model.Space{
		Name:        req.Name,
		Description: req.Description,
		InviteCode:  inviteCode,
		InviteLink:  fmt.Sprintf("https://linetime.app/invite/%s", inviteCode),
		OwnerID:     ownerID,
		Type:        req.Type,
	}

	if err := s.spaceRepo.Create(space); err != nil {
		return nil, err
	}

	// 添加创建者为空间成员
	member := &model.SpaceMember{
		SpaceID: space.ID,
		UserID:  ownerID,
		Role:    model.MemberRoleOwner,
	}

	if err := s.spaceRepo.AddMember(member); err != nil {
		return nil, err
	}

	return space, nil
}

// GetUserSpaces 获取用户的所有空间
func (s *SpaceService) GetUserSpaces(userID uuid.UUID) ([]model.Space, error) {
	return s.spaceRepo.FindByUserID(userID)
}

// GetSpaceByID 获取空间详情
func (s *SpaceService) GetSpaceByID(spaceID, userID uuid.UUID) (*model.Space, error) {
	// 检查用户是否在该空间
	isMember, err := s.spaceRepo.IsUserInSpace(spaceID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("无权访问该空间")
	}

	return s.spaceRepo.FindByID(spaceID)
}

// RefreshInviteCode 刷新邀请码
func (s *SpaceService) RefreshInviteCode(spaceID, userID uuid.UUID) (*model.Space, error) {
	// 获取空间
	space, err := s.spaceRepo.FindByID(spaceID)
	if err != nil {
		return nil, err
	}

	// 检查权限（只有 owner 可以刷新邀请码）
	if space.OwnerID != userID {
		return nil, errors.New("只有空间创建者可以刷新邀请码")
	}

	// 生成新的邀请码
	space.InviteCode = GenerateInviteCode()
	space.InviteLink = fmt.Sprintf("https://linetime.app/invite/%s", space.InviteCode)

	if err := s.spaceRepo.Update(space); err != nil {
		return nil, err
	}

	return space, nil
}

// JoinSpace 通过邀请码加入空间
func (s *SpaceService) JoinSpace(inviteCode string, userID uuid.UUID) (*model.Space, error) {
	// 查找空间
	space, err := s.spaceRepo.FindByInviteCode(inviteCode)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("邀请码无效")
		}
		return nil, err
	}

	// 检查用户是否已在该空间
	isMember, err := s.spaceRepo.IsUserInSpace(space.ID, userID)
	if err != nil {
		return nil, err
	}
	if isMember {
		return nil, errors.New("您已经在该空间中")
	}

	// 添加成员
	member := &model.SpaceMember{
		SpaceID: space.ID,
		UserID:  userID,
		Role:    model.MemberRoleMember,
	}

	if err := s.spaceRepo.AddMember(member); err != nil {
		return nil, err
	}

	return space, nil
}

// RemoveMember 移除成员
func (s *SpaceService) RemoveMember(spaceID, userID, targetUserID uuid.UUID) error {
	// 获取空间
	space, err := s.spaceRepo.FindByID(spaceID)
	if err != nil {
		return err
	}

	// 检查权限（只有 owner 可以移除成员）
	if space.OwnerID != userID {
		return errors.New("只有空间创建者可以移除成员")
	}

	// 不能移除自己
	if userID == targetUserID {
		return errors.New("不能移除自己")
	}

	return s.spaceRepo.RemoveMember(spaceID, targetUserID)
}

// GetSpaceMembers 获取空间成员列表
func (s *SpaceService) GetSpaceMembers(spaceID, userID uuid.UUID) ([]model.SpaceMember, error) {
	// 检查用户是否在该空间
	isMember, err := s.spaceRepo.IsUserInSpace(spaceID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("无权访问该空间")
	}

	return s.spaceRepo.GetMembers(spaceID)
}
