'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { uploadApi } from '@/lib/api';
import { Button } from './Button';
import { getErrorMessage, formatFileSize } from '@/lib/utils';

interface ImageUploadProps {
  maxFiles?: number;
  maxFileSize?: number; // bytes
  onUploadComplete?: (imageUrls: string[]) => void;
  defaultImages?: string[];
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  maxFiles = 9,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  onUploadComplete,
  defaultImages = [],
}) => {
  const [images, setImages] = useState<string[]>(defaultImages);
  const [previews, setPreviews] = useState<string[]>(defaultImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): string | null => {
    if (files.length + images.length > maxFiles) {
      return `最多只能上传 ${maxFiles} 张图片`;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return '只能上传图片文件';
      }
      if (file.size > maxFileSize) {
        return `图片大小不能超过 ${formatFileSize(maxFileSize)}`;
      }
    }

    return null;
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');

    // 验证文件
    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    // 生成预览
    const newPreviews: string[] = [];
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === files.length) {
            setPreviews([...previews, ...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
    }

    // 上传图片
    setUploading(true);
    try {
      const response = await uploadApi.uploadImages(files);
      const newImageUrls = response.data.map((img) => img.image_url);
      const updatedImages = [...images, ...newImageUrls];
      setImages(updatedImages);
      onUploadComplete?.(updatedImages);
    } catch (err) {
      setError(getErrorMessage(err));
      // 移除失败的预览
      setPreviews(previews);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
    onUploadComplete?.(newImages);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 图片预览网格 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={preview}
                alt={`预览 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={uploading}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      {images.length < maxFiles && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={uploading}
            isLoading={uploading}
            className="w-full"
          >
            {uploading ? '上传中...' : '选择图片'}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            支持 JPG、PNG、GIF、WebP 格式，单张最大 {formatFileSize(maxFileSize)}，
            最多 {maxFiles} 张（已选 {images.length} 张）
          </p>
        </div>
      )}
    </div>
  );
};
