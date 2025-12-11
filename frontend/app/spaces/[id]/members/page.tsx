'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSpaceStore } from '@/stores/useSpaceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button, Loading } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { spaceApi } from '@/lib/api/space';
import { getErrorMessage } from '@/lib/utils';
import type { SpaceMember } from '@/types';

export default function SpaceMembersPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.id as string;

  const { user, isAuthenticated, isLoading: authLoading, fetchUser } = useAuthStore();
  const { currentSpace, selectSpace } = useSpaceStore();
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

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
        // 这里不需要再次跳转，避免循环
      });
    }
  }, [mounted, authLoading, isAuthenticated, fetchUser, router]);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await spaceApi.getMembers(spaceId);
      setMembers(response.data);
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (spaceId && isAuthenticated) {
      selectSpace(spaceId);
      loadMembers();
    }
  }, [spaceId, isAuthenticated, selectSpace, loadMembers]);

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!confirm(`确定要移除成员 "${username}" 吗？`)) {
      return;
    }

    setRemovingUserId(userId);
    try {
      await spaceApi.removeMember(spaceId, userId);
      // 重新加载成员列表
      await loadMembers();
      alert('成员已移除');
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setRemovingUserId(null);
    }
  };

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

  const isOwner = currentSpace && currentSpace.owner_id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 返回按钮 */}
        <Link
          href={`/spaces/${spaceId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          ← 返回空间
        </Link>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">成员管理</h1>
          {currentSpace && (
            <p className="text-gray-600">{currentSpace.name} 的所有成员</p>
          )}
        </div>

        {/* 成员列表 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loading text="加载成员列表..." />
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              暂无成员
            </h3>
            <p className="text-gray-600">
              空间暂时没有其他成员
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                共 {members.length} 位成员
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* 头像 */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {member.username ? member.username.charAt(0).toUpperCase() : '?'}
                    </div>

                    {/* 用户信息 */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {member.username || '未知用户'}
                        </h3>
                        {member.role === 'owner' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            所有者
                          </span>
                        )}
                        {member.user_id === user.id && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            我
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        加入于 {new Date(member.joined_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {isOwner && member.role !== 'owner' && member.user_id !== user.id && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id, member.username)}
                      isLoading={removingUserId === member.user_id}
                      disabled={removingUserId === member.user_id}
                    >
                      移除
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 关于成员管理</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 只有空间所有者可以移除成员</li>
            <li>• 空间所有者无法被移除</li>
            <li>• 使用邀请码邀请更多成员加入空间</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
