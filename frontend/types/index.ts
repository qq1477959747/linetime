// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// 空间相关类型
export interface Space {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSpaceRequest {
  name: string;
  description?: string;
}

export interface SpaceMember {
  user_id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'member';
  joined_at: string;
}

// 事件相关类型
export interface Event {
  id: string;
  space_id: string;
  title: string;
  description?: string;
  images?: string[];
  event_date: string;
  location?: string;
  tags?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventRequest {
  space_id: string;
  title: string;
  description?: string;
  images?: string[];
  event_date: string;
  location?: string;
  tags?: string[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  images?: string[];
  event_date?: string;
  location?: string;
  tags?: string[];
}

// 图片上传相关类型
export interface ImageUploadResult {
  image_url: string;
  thumbnail_url: string;
  size: number;
  width: number;
  height: number;
}

// API 响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
