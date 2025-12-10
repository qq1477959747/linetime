'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSpaceStore } from '@/stores/useSpaceStore';
import { Button, Loading } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';

export default function SpacesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, fetchUser } = useAuthStore();
  const { spaces, isLoading: spacesLoading, fetchSpaces } = useSpaceStore();
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchSpaces();
    }
  }, [isAuthenticated, fetchSpaces]);

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">我的空间</h1>
            <p className="text-gray-600">管理您的共享空间和家庭相册</p>
          </div>
          <div className="flex gap-3">
            <Link href="/spaces/join">
              <Button variant="outline">加入空间</Button>
            </Link>
            <Link href="/spaces/create">
              <Button>创建空间</Button>
            </Link>
          </div>
        </div>

        {/* 空间列表 */}
        {spacesLoading ? (
          <div className="flex justify-center py-12">
            <Loading text="加载空间列表..." />
          </div>
        ) : spaces.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              还没有空间
            </h3>
            <p className="text-gray-600 mb-6">
              创建一个新空间，或使用邀请码加入现有空间
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/spaces/join">
                <Button variant="outline">加入空间</Button>
              </Link>
              <Link href="/spaces/create">
                <Button>创建空间</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <Link
                key={space.id}
                href={`/spaces/${space.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">📸</div>
                  {space.owner_id === user.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      我创建的
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {space.name}
                </h3>
                {space.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {space.description}
                  </p>
                )}
                <div className="text-xs text-gray-500">
                  创建于 {formatDate(space.created_at)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
