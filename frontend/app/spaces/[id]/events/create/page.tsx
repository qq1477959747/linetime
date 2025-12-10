'use client';

import { useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEventStore } from '@/stores/useEventStore';
import { Button, Input, ImageUpload } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { getErrorMessage } from '@/lib/utils';

export default function CreateEventPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.id as string;
  const { createEvent, isLoading } = useEventStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    tags: '',
    images: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入事件标题';
    } else if (formData.title.length > 200) {
      newErrors.title = '标题最多 200 个字符';
    }

    if (!formData.event_date) {
      newErrors.event_date = '请选择事件日期';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = '描述最多 2000 个字符';
    }

    if (formData.location && formData.location.length > 200) {
      newErrors.location = '地点最多 200 个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      await createEvent({
        space_id: spaceId,
        title: formData.title,
        description: formData.description || undefined,
        event_date: new Date(formData.event_date).toISOString(),
        location: formData.location || undefined,
        tags: tags.length > 0 ? tags : undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
      });

      router.push(`/spaces/${spaceId}`);
    } catch (error) {
      setErrors({ submit: getErrorMessage(error) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 返回按钮 */}
        <Link
          href={`/spaces/${spaceId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          ← 返回空间
        </Link>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">添加事件</h1>
          <p className="text-gray-600">记录一个美好的时刻</p>
        </div>

        {/* 创建表单 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 全局错误提示 */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            {/* 事件标题 */}
            <Input
              label="事件标题"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
              placeholder="例如：周末野餐"
              disabled={isLoading}
              required
            />

            {/* 事件日期 */}
            <Input
              label="事件日期"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              error={errors.event_date}
              disabled={isLoading}
              required
            />

            {/* 地点 */}
            <Input
              label="地点（可选）"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              error={errors.location}
              placeholder="例如：公园"
              disabled={isLoading}
            />

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述（可选）
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述一下这次活动..."
                rows={4}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* 标签 */}
            <Input
              label="标签（可选）"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="用逗号分隔，例如：户外,家庭,周末"
              disabled={isLoading}
            />

            {/* 图片上传 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                照片
              </label>
              <ImageUpload
                maxFiles={9}
                onUploadComplete={(imageUrls) => {
                  setFormData({ ...formData, images: imageUrls });
                }}
              />
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
                className="flex-1"
              >
                创建事件
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
