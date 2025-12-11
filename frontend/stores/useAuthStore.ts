import { create } from 'zustand';
import { authApi, userApi } from '@/lib/api';
import type { User, LoginRequest, RegisterRequest } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest, rememberMe?: boolean) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setDefaultSpace: (spaceId: string) => Promise<void>;
  clearDefaultSpace: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (data: LoginRequest, rememberMe: boolean = true) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(data, rememberMe);
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  googleLogin: async (idToken: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.googleLogin(idToken);
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(data);
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const response = await authApi.getMe();
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  setDefaultSpace: async (spaceId: string) => {
    try {
      await userApi.setDefaultSpace(spaceId);
      set((state) => ({
        user: state.user ? { ...state.user, default_space_id: spaceId } : null,
      }));
    } catch (error) {
      throw error;
    }
  },

  clearDefaultSpace: async () => {
    try {
      await userApi.clearDefaultSpace();
      set((state) => ({
        user: state.user ? { ...state.user, default_space_id: null } : null,
      }));
    } catch (error) {
      throw error;
    }
  },
}));
