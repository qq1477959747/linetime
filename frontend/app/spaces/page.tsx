'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSpaceStore } from '@/stores/useSpaceStore';
import { Button, Loading } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { formatDate, getErrorMessage } from '@/lib/utils';

export default function SpacesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, fetchUser, setDefaultSpace, clearDefaultSpace } = useAuthStore();
  const { spaces, isLoading: spacesLoading, fetchSpaces } = useSpaceStore();
  const [mounted, setMounted] = useState(false);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

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

  const handleSetDefault = async (spaceId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSettingDefault(spaceId);
    try {
      await setDefaultSpace(spaceId);
    } catch (error) {
      console.error('设置默认空间失败:', getErrorMessage(error));
    } finally {
      setSettingDefault(null);
    }
  };

  const handleClearDefault = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSettingDefault('clearing');
    try {
      await clearDefaultSpace();
    } catch (error) {
      console.error('取消默认空间失败:', getErrorMessage(error));
    } finally {
      setSettingDefault(null);
    }
  };

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
            {spaces.map((space) => {
              const isDefault = user.default_space_id === space.id;
              return (
                <Link
                  key={space.id}
                  href={`/spaces/${space.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">📸</div>
                    <div className="flex gap-2">
                      {isDefault && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          默认
                        </span>
                      )}
                      {space.owner_id === user.id && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          我创建的
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {space.name}
                  </h3>
                  {space.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {space.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      创建于 {formatDate(space.created_at)}
                    </div>
                    {isDefault ? (
                      <button
                        onClick={handleClearDefault}
                        disabled={settingDefault === 'clearing'}
                        className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50"
                      >
                        {settingDefault === 'clearing' ? '取消中...' : '取消默认'}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleSetDefault(space.id, e)}
                        disabled={settingDefault === space.id}
                        className="text-xs text-gray-500 hover:text-green-600 disabled:opacity-50"
                      >
                        {settingDefault === space.id ? '设置中...' : '设为默认'}
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
