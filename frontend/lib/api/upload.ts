import { apiClient } from './client';
import type { ImageUploadResult } from '@/types';

export const uploadApi = {
  // 上传单张图片
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.upload<ImageUploadResult>('/upload/image', formData);
  },

  // 批量上传图片
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    return apiClient.upload<ImageUploadResult[]>('/upload/images', formData);
  },
};
