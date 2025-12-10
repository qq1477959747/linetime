import { apiClient } from './client';
import type { Event, CreateEventRequest, UpdateEventRequest } from '@/types';

export const eventApi = {
  // 创建事件
  create: (data: CreateEventRequest) => {
    return apiClient.post<Event>('/events', data);
  },

  // 获取事件详情
  getById: (id: string) => {
    return apiClient.get<Event>(`/events/${id}`);
  },

  // 更新事件
  update: (id: string, data: UpdateEventRequest) => {
    return apiClient.put<Event>(`/events/${id}`, data);
  },

  // 删除事件
  delete: (id: string) => {
    return apiClient.delete(`/events/${id}`);
  },

  // 获取空间的事件列表
  getBySpace: (spaceId: string, params?: { start_date?: string; end_date?: string }) => {
    return apiClient.get<Event[]>(`/events/spaces/${spaceId}`, { params });
  },
};
