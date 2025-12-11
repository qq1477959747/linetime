import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      async (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          // Token 过期或无效，清除本地存储并跳转登录
          this.clearToken();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        // 提取后端返回的错误信息
        const errorMessage = error.response?.data?.message || error.message || '请求失败';
        const customError = new Error(errorMessage);
        return Promise.reject(customError);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    // 优先从 localStorage 获取（记住我），其次从 sessionStorage 获取
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  }

  private clearToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  }

  public setToken(accessToken: string, refreshToken?: string, rememberMe: boolean = true) {
    if (typeof window === 'undefined') return;
    
    // 根据"记住我"选项决定存储位置
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // 清除另一个存储中的 token
    if (rememberMe) {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    
    storage.setItem('access_token', accessToken);
    if (refreshToken) {
      storage.setItem('refresh_token', refreshToken);
    }
    
    // 保存记住我状态
    localStorage.setItem('remember_me', rememberMe ? 'true' : 'false');
  }

  public get<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
    return this.client.get(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.client.post(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.client.put(url, data, config);
  }

  public delete<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
    return this.client.delete(url, config);
  }

  public upload<T = any>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const apiClient = new ApiClient();
