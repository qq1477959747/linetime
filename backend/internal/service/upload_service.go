package service

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"mime/multipart"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/nfnt/resize"
	"github.com/qq1477959747/linetime/backend/config"
	"github.com/qq1477959747/linetime/backend/internal/pkg/validator"
	"github.com/qq1477959747/linetime/backend/internal/storage"
)

type UploadService struct {
	storage *storage.MinIOStorage
}

func NewUploadService(storage *storage.MinIOStorage) *UploadService {
	return &UploadService{storage: storage}
}

type ImageUploadResult struct {
	ImageURL     string `json:"image_url"`
	ThumbnailURL string `json:"thumbnail_url"`
	Size         int64  `json:"size"`
	Width        int    `json:"width"`
	Height       int    `json:"height"`
}

// UploadImage 上传图片并生成缩略图
func (s *UploadService) UploadImage(ctx context.Context, file *multipart.FileHeader) (*ImageUploadResult, error) {
	// 验证文件大小
	if file.Size > config.AppConfig.Upload.MaxFileSize {
		return nil, fmt.Errorf("文件大小超过限制（最大 %d MB）", config.AppConfig.Upload.MaxFileSize/1024/1024)
	}

	// 验证文件类型
	allowedTypes := strings.Split(config.AppConfig.Upload.AllowedFileTypes, ",")
	if !validator.IsValidFileType(file.Filename, allowedTypes) {
		return nil, fmt.Errorf("不支持的文件类型，仅支持: %s", config.AppConfig.Upload.AllowedFileTypes)
	}

	// 打开文件
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("打开文件失败: %w", err)
	}
	defer src.Close()

	// 读取图片
	img, format, err := image.Decode(src)
	if err != nil {
		return nil, fmt.Errorf("解码图片失败: %w", err)
	}

	// 获取图片尺寸
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// 生成唯一文件名
	ext := filepath.Ext(file.Filename)
	filename := uuid.New().String() + ext

	// 上传原图
	src.Seek(0, 0) // 重置读取位置
	originalPath := fmt.Sprintf("images/original/%s", filename)
	originalURL, err := s.storage.UploadFile(ctx, originalPath, src, file.Size, file.Header.Get("Content-Type"))
	if err != nil {
		return nil, fmt.Errorf("上传原图失败: %w", err)
	}

	// 生成缩略图（宽度 400px）
	thumbnail := resize.Resize(400, 0, img, resize.Lanczos3)
	thumbnailBuf := new(bytes.Buffer)

	// 根据原图格式编码缩略图
	switch format {
	case "jpeg", "jpg":
		err = jpeg.Encode(thumbnailBuf, thumbnail, &jpeg.Options{Quality: 85})
	case "png":
		err = png.Encode(thumbnailBuf, thumbnail)
	default:
		err = jpeg.Encode(thumbnailBuf, thumbnail, &jpeg.Options{Quality: 85})
	}

	if err != nil {
		return nil, fmt.Errorf("编码缩略图失败: %w", err)
	}

	// 上传缩略图
	thumbnailPath := fmt.Sprintf("images/thumbnails/%s", filename)
	thumbnailURL, err := s.storage.UploadFile(
		ctx,
		thumbnailPath,
		bytes.NewReader(thumbnailBuf.Bytes()),
		int64(thumbnailBuf.Len()),
		file.Header.Get("Content-Type"),
	)
	if err != nil {
		return nil, fmt.Errorf("上传缩略图失败: %w", err)
	}

	return &ImageUploadResult{
		ImageURL:     originalURL,
		ThumbnailURL: thumbnailURL,
		Size:         file.Size,
		Width:        width,
		Height:       height,
	}, nil
}

// UploadImages 批量上传图片
func (s *UploadService) UploadImages(ctx context.Context, files []*multipart.FileHeader) ([]*ImageUploadResult, error) {
	if len(files) > config.AppConfig.Upload.MaxFilesPerUpload {
		return nil, fmt.Errorf("单次最多上传 %d 张图片", config.AppConfig.Upload.MaxFilesPerUpload)
	}

	results := make([]*ImageUploadResult, 0, len(files))
	for _, file := range files {
		result, err := s.UploadImage(ctx, file)
		if err != nil {
			return nil, err
		}
		results = append(results, result)
	}

	return results, nil
}

// DeleteImage 删除图片
func (s *UploadService) DeleteImage(ctx context.Context, imageURL string) error {
	objectName := storage.GetObjectNameFromURL(imageURL)
	return s.storage.DeleteFile(ctx, objectName)
}
