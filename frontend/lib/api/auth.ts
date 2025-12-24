import { apiClient } from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types';

export const authApi = {
  // 登录
  login: async (data: LoginRequest, rememberMe: boolean = true) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    if (response.data?.access_token) {
      apiClient.setToken(response.data.access_token, response.data.refresh_token, rememberMe);
    }
    return response;
  },

  // 注册
  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    if (response.data?.access_token) {
      apiClient.setToken(response.data.access_token, response.data.refresh_token, true);
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
      localStorage.removeItem('remember_me');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
    }
  },

  // 请求密码重置
  forgotPassword: async (email: string) => {
    return apiClient.post<{ message: string; masked_email: string }>('/auth/forgot-password', { email });
  },

  // 重置密码
  resetPassword: async (email: string, code: string, newPassword: string) => {
    return apiClient.post<{ message: string }>('/auth/reset-password', {
      email,
      code,
      new_password: newPassword,
    });
  },

  // 修改密码
  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiClient.post<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};
