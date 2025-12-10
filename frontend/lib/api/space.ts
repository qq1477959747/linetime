import { apiClient } from './client';
import type { Space, CreateSpaceRequest, SpaceMember } from '@/types';

export const spaceApi = {
  // 创建空间
  create: (data: CreateSpaceRequest) => {
    return apiClient.post<Space>('/spaces', data);
  },

  // 获取用户的所有空间
  getAll: () => {
    return apiClient.get<Space[]>('/spaces');
  },

  // 获取空间详情
  getById: (id: string) => {
    return apiClient.get<Space>(`/spaces/${id}`);
  },

  // 刷新邀请码
  refreshInviteCode: (id: string) => {
    return apiClient.post<Space>(`/spaces/${id}/invite`);
  },

  // 加入空间
  join: (code: string) => {
    return apiClient.post<Space>(`/spaces/join/${code}`);
  },

  // 获取空间成员
  getMembers: (id: string) => {
    return apiClient.get<SpaceMember[]>(`/spaces/${id}/members`);
  },

  // 移除成员
  removeMember: (spaceId: string, userId: string) => {
    return apiClient.delete(`/spaces/${spaceId}/members/${userId}`);
  },
};
