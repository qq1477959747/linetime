'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSpaceStore } from '@/stores/useSpaceStore';
import { useEventStore } from '@/stores/useEventStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button, Loading } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.id as string;

  const { user } = useAuthStore();
  const { currentSpace, selectSpace, isLoading: spaceLoading } = useSpaceStore();
  const { events, fetchEvents, isLoading: eventsLoading } = useEventStore();
  const [showInviteCode, setShowInviteCode] = useState(false);

  useEffect(() => {
    if (spaceId) {
      selectSpace(spaceId);
      fetchEvents(spaceId);
    }
  }, [spaceId, selectSpace, fetchEvents]);

  const isOwner = currentSpace && user && currentSpace.owner_id === user.id;

  const copyInviteCode = () => {
    if (currentSpace?.invite_code) {
      navigator.clipboard.writeText(currentSpace.invite_code);
      alert('邀请码已复制到剪贴板');
    }
  };

  if (spaceLoading || !currentSpace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="加载空间信息..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link
          href="/spaces"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          ← 返回空间列表
        </Link>

        {/* 空间信息卡片 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {currentSpace.name}
                </h1>
                {isOwner && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    我创建的
                  </span>
                )}
              </div>
              {currentSpace.description && (
                <p className="text-gray-600 mb-4">{currentSpace.description}</p>
              )}
              <p className="text-sm text-gray-500">
                创建于 {formatDate(currentSpace.created_at)}
              </p>
            </div>

            <div className="flex gap-3">
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteCode(!showInviteCode)}
                >
                  {showInviteCode ? '隐藏邀请码' : '查看邀请码'}
                </Button>
              )}
              <Link href={`/spaces/${spaceId}/members`}>
                <Button variant="outline" size="sm">
                  成员管理
                </Button>
              </Link>
              <Link href={`/spaces/${spaceId}/events/create`}>
                <Button size="sm">添加事件</Button>
              </Link>
            </div>
          </div>

          {/* 邀请码显示 */}
          {showInviteCode && isOwner && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">邀请码</p>
                  <p className="text-2xl font-mono font-bold text-blue-600 tracking-widest">
                    {currentSpace.invite_code}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={copyInviteCode}>
                  复制邀请码
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 事件时间轴 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">时间轴</h2>
        </div>

        {eventsLoading ? (
          <div className="flex justify-center py-12">
            <Loading text="加载事件..." />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              还没有事件
            </h3>
            <p className="text-gray-600 mb-6">
              添加第一个事件，开始记录美好时光
            </p>
            <Link href={`/spaces/${spaceId}/events/create`}>
              <Button>添加事件</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/spaces/${spaceId}/events/${event.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* 日期标签 */}
                  <div className="flex-shrink-0 text-center">
                    <div className="bg-blue-100 text-blue-700 rounded-lg px-3 py-2">
                      <div className="text-xs font-medium">
                        {formatDate(event.event_date, 'MM月')}
                      </div>
                      <div className="text-2xl font-bold">
                        {formatDate(event.event_date, 'dd')}
                      </div>
                    </div>
                  </div>

                  {/* 事件内容 */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-sm text-gray-500 mb-2">
                        📍 {event.location}
                      </p>
                    )}
                    {event.images && event.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {event.images.slice(0, 4).map((image, index) => (
                          <div
                            key={index}
                            className="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden"
                          >
                            <img
                              src={image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {event.images.length > 4 && (
                          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                            +{event.images.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
