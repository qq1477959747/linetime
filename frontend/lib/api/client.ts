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
        // 检查业务层面的错误（HTTP 200 但 code 不是 200）
        const data = response.data as ApiResponse;
        if (data.code && data.code !== 200) {
          const error = new Error(data.message || '请求失败');
          return Promise.reject(error);
        }
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
        
        // 优先使用后端返回的业务错误信息
        const responseData = error.response?.data;
        if (responseData?.message) {
          return Promise.reject(new Error(responseData.message));
        }
        
        // 网络层面的错误
        let errorMessage = '请求失败，请稍后重试';
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          errorMessage = '请求超时，请检查网络后重试';
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
          errorMessage = '网络连接失败，请检查网络后重试';
        } else if (error.response?.status) {
          const statusMessages: Record<number, string> = {
            403: '没有权限执行此操作',
            404: '请求的资源不存在',
            500: '服务器内部错误，请稍后重试',
            502: '服务暂时不可用，请稍后重试',
            503: '服务维护中，请稍后重试',
          };
          errorMessage = statusMessages[error.response.status] || errorMessage;
        }
        
        return Promise.reject(new Error(errorMessage));
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
