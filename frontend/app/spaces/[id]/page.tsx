'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSpaceStore } from '@/stores/useSpaceStore';
import { useEventStore } from '@/stores/useEventStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button, Loading } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.id as string;

  const { user, isAuthenticated, isLoading: authLoading, fetchUser } = useAuthStore();
  const { currentSpace, selectSpace, isLoading: spaceLoading } = useSpaceStore();
  const { events, fetchEvents, isLoading: eventsLoading } = useEventStore();
  const [showInviteCode, setShowInviteCode] = useState(false);
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

  useEffect(() => {
    if (spaceId && isAuthenticated) {
      selectSpace(spaceId);
      fetchEvents(spaceId);
    }
  }, [spaceId, isAuthenticated, selectSpace, fetchEvents]);

  const isOwner = currentSpace && user && currentSpace.owner_id === user.id;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const copyInviteCode = () => {
    if (currentSpace?.invite_code) {
      navigator.clipboard.writeText(currentSpace.invite_code);
      alert('邀请码已复制到剪贴板');
    }
  };

  const handleDeleteSpace = async () => {
    if (!currentSpace) return;
    setIsDeleting(true);
    try {
      const { spaceApi } = await import('@/lib/api');
      await spaceApi.delete(currentSpace.id);
      router.push('/spaces');
    } catch (error) {
      alert('删除空间失败，请重试');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="lg" text="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (spaceLoading || !currentSpace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="lg" text="加载空间信息..." />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* Timeline unfold animation */
        @keyframes timeline-grow {
          from {
            height: 0;
          }
          to {
            height: 100%;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes dot-pop {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          60% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes card-slide {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .timeline-line {
          animation: timeline-grow 1.5s ease-out forwards;
          transform-origin: top;
        }

        .event-card {
          animation: fade-in-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }

        .timeline-dot {
          animation: dot-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
        }

        .event-content {
          animation: card-slide 0.5s ease-out backwards;
        }

        .event-card:nth-child(1) { animation-delay: 0.2s; }
        .event-card:nth-child(1) .timeline-dot { animation-delay: 0.1s; }
        .event-card:nth-child(1) .event-content { animation-delay: 0.3s; }

        .event-card:nth-child(2) { animation-delay: 0.4s; }
        .event-card:nth-child(2) .timeline-dot { animation-delay: 0.3s; }
        .event-card:nth-child(2) .event-content { animation-delay: 0.5s; }

        .event-card:nth-child(3) { animation-delay: 0.6s; }
        .event-card:nth-child(3) .timeline-dot { animation-delay: 0.5s; }
        .event-card:nth-child(3) .event-content { animation-delay: 0.7s; }

        .event-card:nth-child(4) { animation-delay: 0.8s; }
        .event-card:nth-child(4) .timeline-dot { animation-delay: 0.7s; }
        .event-card:nth-child(4) .event-content { animation-delay: 0.9s; }

        .event-card:nth-child(5) { animation-delay: 1.0s; }
        .event-card:nth-child(5) .timeline-dot { animation-delay: 0.9s; }
        .event-card:nth-child(5) .event-content { animation-delay: 1.1s; }

        .event-card:nth-child(n+6) { animation-delay: 1.2s; }
        .event-card:nth-child(n+6) .timeline-dot { animation-delay: 1.1s; }
        .event-card:nth-child(n+6) .event-content { animation-delay: 1.3s; }

        .end-marker {
          animation: dot-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
          animation-delay: 1.5s;
        }

        /* Hover effects */
        .event-card:hover .timeline-dot {
          transform: scale(1.1);
          transition: transform 0.3s ease;
        }

        .event-card .event-content:hover {
          transform: translateX(4px);
          transition: transform 0.3s ease;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md border-b border-gray-200 bg-white/90">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/spaces" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors">
                <span className="text-white text-xl">←</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentSpace.name}
                </h1>
                <p className="text-sm text-gray-600">
                  共 {events.length} 个回忆
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInviteCode(!showInviteCode)}
                  >
                    {showInviteCode ? '隐藏邀请码' : '邀请成员'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    删除空间
                  </Button>
                </>
              )}
              <Link href={`/spaces/${spaceId}/members`}>
                <Button variant="outline" size="sm">
                  成员
                </Button>
              </Link>
              <Link href={`/spaces/${spaceId}/events/create`}>
                <Button size="sm">
                  + 新回忆
                </Button>
              </Link>
            </div>
          </div>

          {/* Invite code panel */}
          {showInviteCode && isOwner && (
            <div className="border-t border-gray-200 px-6 py-4 max-w-6xl mx-auto bg-blue-50">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium mb-1 text-gray-700">
                    空间邀请码
                  </p>
                  <p className="text-3xl font-mono font-bold tracking-wider text-blue-600">
                    {currentSpace.invite_code}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={copyInviteCode}>
                  复制邀请码
                </Button>
              </div>
            </div>
          )}
        </header>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-6 py-12">
          {/* Space description */}
          {currentSpace.description && (
            <div className="mb-12 text-center max-w-2xl mx-auto">
              <p className="text-lg leading-relaxed text-gray-600">
                {currentSpace.description}
              </p>
            </div>
          )}

          {/* Timeline */}
          {eventsLoading ? (
            <div className="flex justify-center py-20">
              <Loading text="加载回忆..." />
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📷</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                开始记录美好时光
              </h3>
              <p className="text-gray-600 mb-6">
                添加第一个回忆，让时间线充满温馨故事
              </p>
              <Link href={`/spaces/${spaceId}/events/create`}>
                <Button size="lg">
                  创建第一个回忆
                </Button>
              </Link>
            </div>
          ) : (
            <div className="relative max-w-3xl mx-auto pl-4">
              {/* Timeline line */}
              <div className="timeline-line absolute left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-300" />

              {/* Events */}
              <div className="space-y-10">
                {events.filter(event => event && event.id).map((event, index) => (
                  <div
                    key={event.id}
                    className="event-card relative flex gap-6"
                  >
                    {/* Timeline dot */}
                    <div className="relative flex-shrink-0 w-20">
                      <div className="timeline-dot w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-white shadow-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-white text-sm font-bold leading-tight">
                            {formatDate(event.event_date, 'dd')}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <div className="text-xs font-medium text-gray-500">
                          {formatDate(event.event_date, 'MM月')}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(event.event_date, 'yyyy')}
                        </div>
                      </div>
                    </div>

                    {/* Event card */}
                    <Link href={`/spaces/${spaceId}/events/${event.id}`} className="flex-1">
                      <div className="event-content bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                        {/* Images */}
                        {event.images && event.images.length > 0 && (
                          <div className={`overflow-hidden bg-gray-100 ${
                            event.images.length === 1 ? 'aspect-[16/9]' : 'grid grid-cols-2 gap-1'
                          }`}>
                            {event.images.slice(0, 4).map((image, idx) => {
                              const images = event.images!;
                              return (
                                <div key={idx} className={`relative overflow-hidden ${
                                  images.length === 1 ? 'w-full h-full' : 'aspect-square'
                                }`}>
                                  <img
                                    src={image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                  {idx === 3 && images.length > 4 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                      <span className="text-white text-2xl font-semibold">
                                        +{images.length - 4}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {event.title}
                          </h3>

                          {event.description && (
                            <p className="text-base text-gray-700 leading-relaxed mb-3 line-clamp-3">
                              {event.description}
                            </p>
                          )}

                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <span>📍</span>
                              <span>{event.location}</span>
                            </div>
                          )}

                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {event.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* End marker */}
              <div className="relative flex gap-6 mt-10">
                <div className="flex-shrink-0 w-20">
                  <div className="end-marker w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-xl">✨</span>
                  </div>
                </div>
                <div className="flex-1 flex items-center">
                  <p className="text-base text-gray-400 italic font-light">
                    故事未完待续...
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 mt-20">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
            <p>记录每一个值得珍藏的瞬间</p>
          </div>
        </footer>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-2">确认删除空间</h3>
              <p className="text-gray-600 mb-4">
                删除空间「{currentSpace.name}」后，所有回忆和成员关系都将被删除，此操作无法撤销。
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  取消
                </Button>
                <Button
                  onClick={handleDeleteSpace}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? '删除中...' : '确认删除'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
