'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEventStore } from '@/stores/useEventStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button, Loading } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { formatDate, getErrorMessage } from '@/lib/utils';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const eventId = params.eventId as string;

  const { user } = useAuthStore();
  const { currentEvent, selectEvent, deleteEvent, isLoading } = useEventStore();
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      selectEvent(eventId);
    }
  }, [eventId, selectEvent]);

  const handleDelete = async () => {
    if (!confirm('确定要删除这个事件吗？此操作不可恢复。')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteEvent(eventId);
      router.push(`/spaces/${spaceId}`);
    } catch (error) {
      alert(getErrorMessage(error));
      setDeleting(false);
    }
  };

  if (isLoading || !currentEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="加载事件信息..." />
      </div>
    );
  }

  const isCreator = user && currentEvent.created_by === user.id;

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

        {/* 事件内容 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 头部 */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentEvent.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>📅 {formatDate(currentEvent.event_date, 'yyyy年MM月dd日')}</span>
                  {currentEvent.location && (
                    <span>📍 {currentEvent.location}</span>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              {isCreator && (
                <div className="flex gap-2">
                  <Link href={`/spaces/${spaceId}/events/${eventId}/edit`}>
                    <Button variant="outline" size="sm">编辑</Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    isLoading={deleting}
                    disabled={deleting}
                  >
                    删除
                  </Button>
                </div>
              )}
            </div>

            {/* 标签 */}
            {currentEvent.tags && currentEvent.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {currentEvent.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 描述 */}
          {currentEvent.description && (
            <div className="p-8 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">描述</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{currentEvent.description}</p>
            </div>
          )}

          {/* 图片网格 */}
          {currentEvent.images && currentEvent.images.length > 0 && (
            <div className="p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                照片 ({currentEvent.images.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currentEvent.images.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`照片 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 元信息 */}
          <div className="px-8 py-4 bg-gray-50 text-xs text-gray-500">
            创建于 {formatDate(currentEvent.created_at, 'yyyy-MM-dd HH:mm')}
            {currentEvent.updated_at !== currentEvent.created_at && (
              <> · 更新于 {formatDate(currentEvent.updated_at, 'yyyy-MM-dd HH:mm')}</>
            )}
          </div>
        </div>
      </main>

      {/* 图片查看器 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl font-light hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
          <img
            src={selectedImage}
            alt="查看大图"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
