'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSpaceStore } from '@/stores/useSpaceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button, Input, Loading } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { getErrorMessage } from '@/lib/utils';

export default function JoinSpacePage() {
  const router = useRouter();
  const { joinSpace, isLoading } = useSpaceStore();
  const { isAuthenticated, isLoading: authLoading, fetchUser } = useAuthStore();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('access_token') || sessionStorage.getItem('access_token')) 
      : null;

    if (!token) {
      router.push('/login');
      return;
    }

    // 只有在没有认证且不在加载中时才获取用户信息
    if (!isAuthenticated && !authLoading) {
      fetchUser().catch(() => {
        // fetchUser 失败时，apiClient 已经处理了 401 跳转
      });
    }
  }, [mounted, authLoading, isAuthenticated, fetchUser, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('请输入邀请码');
      return;
    }

    try {
      const space = await joinSpace(inviteCode.trim());
      router.push(`/spaces/${space.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">加入空间</h1>
          <p className="text-gray-600">使用邀请码加入一个已存在的共享空间</p>
        </div>

        {/* 加入表单 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 邀请码输入 */}
            <div>
              <Input
                label="邀请码"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="请输入 6 位邀请码"
                disabled={isLoading}
                required
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
              <p className="mt-2 text-sm text-gray-500">
                请向空间创建者获取邀请码
              </p>
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
                加入空间
              </Button>
            </div>
          </form>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 如何获取邀请码？</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 联系空间创建者，获取 6 位邀请码</li>
            <li>• 每个空间都有唯一的邀请码</li>
            <li>• 加入后即可查看和上传照片</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
