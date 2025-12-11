'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSpaceStore } from '@/stores/useSpaceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button, Input, Loading } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { getErrorMessage } from '@/lib/utils';

export default function CreateSpacePage() {
  const router = useRouter();
  const { createSpace, isLoading } = useSpaceStore();
  const { isAuthenticated, isLoading: authLoading, fetchUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      if (!token) {
        router.push('/login');
        return;
      }

      if (!isAuthenticated) {
        fetchUser().catch(() => {
          router.push('/login');
        });
      }
    }
  }, [mounted, authLoading, isAuthenticated, fetchUser, router]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入空间名称';
    } else if (formData.name.length > 100) {
      newErrors.name = '空间名称最多 100 个字符';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '描述最多 500 个字符';
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
      const space = await createSpace({
        name: formData.name,
        description: formData.description || undefined,
      });
      router.push(`/spaces/${space.id}`);
    } catch (error) {
      setErrors({ submit: getErrorMessage(error) });
    }
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 返回按钮 */}
        <Link
          href="/spaces"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          ← 返回空间列表
        </Link>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">创建新空间</h1>
          <p className="text-gray-600">创建一个新的共享空间，邀请家人朋友一起记录美好时光</p>
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

            {/* 空间名称 */}
            <Input
              label="空间名称"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              placeholder="例如：我们的家庭相册"
              disabled={isLoading}
              required
            />

            {/* 空间描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                空间描述（可选）
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="简单描述一下这个空间..."
                rows={4}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-3">
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
                创建空间
              </Button>
            </div>
          </form>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 提示</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 创建空间后，您将成为空间的拥有者</li>
            <li>• 您可以邀请其他用户加入您的空间</li>
            <li>• 空间成员可以共同上传和查看照片</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
