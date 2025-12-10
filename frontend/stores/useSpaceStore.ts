import { create } from 'zustand';
import { spaceApi } from '@/lib/api';
import type { Space, CreateSpaceRequest, SpaceMember } from '@/types';

interface SpaceState {
  spaces: Space[];
  currentSpace: Space | null;
  members: SpaceMember[];
  isLoading: boolean;
  fetchSpaces: () => Promise<void>;
  createSpace: (data: CreateSpaceRequest) => Promise<Space>;
  selectSpace: (spaceId: string) => Promise<void>;
  joinSpace: (code: string) => Promise<Space>;
  refreshInviteCode: (spaceId: string) => Promise<void>;
  fetchMembers: (spaceId: string) => Promise<void>;
  removeMember: (spaceId: string, userId: string) => Promise<void>;
  setCurrentSpace: (space: Space | null) => void;
}

export const useSpaceStore = create<SpaceState>((set, get) => ({
  spaces: [],
  currentSpace: null,
  members: [],
  isLoading: false,

  fetchSpaces: async () => {
    set({ isLoading: true });
    try {
      const response = await spaceApi.getAll();
      set({ spaces: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createSpace: async (data: CreateSpaceRequest) => {
    set({ isLoading: true });
    try {
      const response = await spaceApi.create(data);
      const newSpace = response.data;
      set((state) => ({
        spaces: [...state.spaces, newSpace],
        isLoading: false,
      }));
      return newSpace;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  selectSpace: async (spaceId: string) => {
    set({ isLoading: true });
    try {
      const response = await spaceApi.getById(spaceId);
      set({ currentSpace: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  joinSpace: async (code: string) => {
    set({ isLoading: true });
    try {
      const response = await spaceApi.join(code);
      const newSpace = response.data;
      set((state) => ({
        spaces: [...state.spaces, newSpace],
        isLoading: false,
      }));
      return newSpace;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  refreshInviteCode: async (spaceId: string) => {
    set({ isLoading: true });
    try {
      const response = await spaceApi.refreshInviteCode(spaceId);
      const updatedSpace = response.data;
      set((state) => ({
        spaces: state.spaces.map((s) =>
          s.id === spaceId ? updatedSpace : s
        ),
        currentSpace: state.currentSpace?.id === spaceId
          ? updatedSpace
          : state.currentSpace,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchMembers: async (spaceId: string) => {
    set({ isLoading: true });
    try {
      const response = await spaceApi.getMembers(spaceId);
      set({ members: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeMember: async (spaceId: string, userId: string) => {
    set({ isLoading: true });
    try {
      await spaceApi.removeMember(spaceId, userId);
      set((state) => ({
        members: state.members.filter((m) => m.user_id !== userId),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setCurrentSpace: (space: Space | null) => {
    set({ currentSpace: space });
  },
}));
