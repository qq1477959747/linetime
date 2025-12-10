package storage

import (
	"context"
	"fmt"
	"io"
	"path/filepath"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/qq1477959747/linetime/backend/config"
)

type MinIOStorage struct {
	client *minio.Client
	bucket string
}

func NewMinIOStorage() (*MinIOStorage, error) {
	cfg := config.AppConfig.MinIO

	// 初始化 MinIO 客户端
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("初始化 MinIO 客户端失败: %w", err)
	}

	// 检查 Bucket 是否存在，不存在则创建
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, cfg.Bucket)
	if err != nil {
		return nil, fmt.Errorf("检查 Bucket 失败: %w", err)
	}

	if !exists {
		err = client.MakeBucket(ctx, cfg.Bucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("创建 Bucket 失败: %w", err)
		}
	}

	return &MinIOStorage{
		client: client,
		bucket: cfg.Bucket,
	}, nil
}

// UploadFile 上传文件
func (s *MinIOStorage) UploadFile(ctx context.Context, objectName string, reader io.Reader, size int64, contentType string) (string, error) {
	_, err := s.client.PutObject(ctx, s.bucket, objectName, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("上传文件失败: %w", err)
	}

	// 返回文件 URL
	url := fmt.Sprintf("http://%s/%s/%s", config.AppConfig.MinIO.Endpoint, s.bucket, objectName)
	if config.AppConfig.MinIO.UseSSL {
		url = fmt.Sprintf("https://%s/%s/%s", config.AppConfig.MinIO.Endpoint, s.bucket, objectName)
	}

	return url, nil
}

// DeleteFile 删除文件
func (s *MinIOStorage) DeleteFile(ctx context.Context, objectName string) error {
	err := s.client.RemoveObject(ctx, s.bucket, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("删除文件失败: %w", err)
	}
	return nil
}

// GetFileURL 获取文件访问 URL（预签名）
func (s *MinIOStorage) GetFileURL(ctx context.Context, objectName string) (string, error) {
	// 生成 1小时有效期的预签名 URL
	url, err := s.client.PresignedGetObject(ctx, s.bucket, objectName, 3600, nil)
	if err != nil {
		return "", fmt.Errorf("生成预签名 URL 失败: %w", err)
	}
	return url.String(), nil
}

// GetObjectNameFromURL 从 URL 中提取对象名称
func GetObjectNameFromURL(url string) string {
	// 简单实现：从 URL 中提取最后一部分作为对象名
	return filepath.Base(url)
}
