import { apiClient } from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types';

export const authApi = {
  // 登录
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (response.data.access_token) {
      apiClient.setToken(response.data.access_token, response.data.refresh_token);
    }
    return response;
  },

  // 注册
  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (response.data.access_token) {
      apiClient.setToken(response.data.access_token, response.data.refresh_token);
    }
    return response;
  },

  // 获取当前用户信息
  getMe: () => {
    return apiClient.get<User>('/auth/me');
  },

  // 退出登录
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },
};
