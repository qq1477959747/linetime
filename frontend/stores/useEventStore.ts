import { create } from 'zustand';
import { eventApi } from '@/lib/api';
import type { Event, CreateEventRequest, UpdateEventRequest } from '@/types';

interface EventState {
  events: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  fetchEvents: (spaceId: string, params?: { start_date?: string; end_date?: string }) => Promise<void>;
  createEvent: (data: CreateEventRequest) => Promise<Event>;
  updateEvent: (id: string, data: UpdateEventRequest) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  selectEvent: (id: string) => Promise<void>;
  setCurrentEvent: (event: Event | null) => void;
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  currentEvent: null,
  isLoading: false,

  fetchEvents: async (spaceId: string, params?: { start_date?: string; end_date?: string }) => {
    set({ isLoading: true });
    try {
      const response = await eventApi.getBySpace(spaceId, params);
      set({ events: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createEvent: async (data: CreateEventRequest) => {
    set({ isLoading: true });
    try {
      const response = await eventApi.create(data);
      const newEvent = response.data;
      set((state) => ({
        events: [...state.events, newEvent],
        isLoading: false,
      }));
      return newEvent;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateEvent: async (id: string, data: UpdateEventRequest) => {
    set({ isLoading: true });
    try {
      const response = await eventApi.update(id, data);
      const updatedEvent = response.data;
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
        currentEvent: state.currentEvent?.id === id ? updatedEvent : state.currentEvent,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteEvent: async (id: string) => {
    set({ isLoading: true });
    try {
      await eventApi.delete(id);
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  selectEvent: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await eventApi.getById(id);
      set({ currentEvent: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setCurrentEvent: (event: Event | null) => {
    set({ currentEvent: event });
  },
}));
