import { apiClient } from './client';
import type { SetDefaultSpaceRequest } from '@/types';

export const userApi = {
  // 设置默认空间
  setDefaultSpace: (spaceId: string) => {
    return apiClient.put<{ default_space_id: string }>('/users/default-space', {
      space_id: spaceId,
    } as SetDefaultSpaceRequest);
  },

  // 清除默认空间
  clearDefaultSpace: () => {
    return apiClient.delete<null>('/users/default-space');
  },
};
