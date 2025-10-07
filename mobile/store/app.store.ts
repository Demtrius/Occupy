import { create } from "zustand";
import { AppNotification } from "../types/store";

interface AppStore {
  // State
  domain: string;
  isLoading: boolean;
  isOnline: boolean;
  error: string | null;
  notifications: AppNotification[];
  theme: "light" | "dark" | "auto";
  language: string;

  // Loading state
  setLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Network status
  setOnlineStatus: (status: boolean) => void;

  // Notifications
  addNotification: (notification: Omit<AppNotification, "id">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Theme
  setTheme: (theme: "light" | "dark" | "auto") => void;

  // Language
  setLanguage: (language: string) => void;

  // Reset app state
  reset: () => void;
}

const initialState = {
  domain: process.env.EXPO_PUBLIC_BACKEND_URL || "",
  isLoading: false,
  isOnline: true,
  error: null,
  notifications: [],
  theme: "auto" as const,
  language: "en",
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,

  // Loading state management
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  startLoading: () => {
    set({ isLoading: true });
  },

  stopLoading: () => {
    set({ isLoading: false });
  },

  // Error handling
  setError: (error: string | null) => {
    set({ error });
    if (error) {
      // Auto-add error notification
      get().addNotification({
        type: "error",
        message: error,
        duration: 5000,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // Network status
  setOnlineStatus: (status: boolean) => {
    set({ isOnline: status });
    if (!status) {
      get().addNotification({
        type: "warning",
        message: "No internet connection",
        duration: 0, // Stay until dismissed
      });
    } else {
      // Clear offline notification when back online
      const offlineNotification = get().notifications.find(
        (n) => n.message === "No internet connection",
      );
      if (offlineNotification) {
        get().removeNotification(offlineNotification.id);
      }
    }
  },

  // Notifications management
  addNotification: (notification: Omit<AppNotification, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: AppNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 3000,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove notification after duration (if duration > 0)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  // Theme management
  setTheme: (theme: "light" | "dark" | "auto") => {
    set({ theme });
    // You can persist this to AsyncStorage if needed
  },

  // Language management
  setLanguage: (language: string) => {
    set({ language });
    // You can persist this to AsyncStorage if needed
  },

  // Reset app state
  reset: () => {
    set({
      ...initialState,
      notifications: [],
    });
  },
}));

// Helper functions for common notification types
export const showSuccess = (message: string, duration?: number) => {
  useAppStore.getState().addNotification({
    type: "success",
    message,
    duration,
  });
};

export const showError = (message: string, duration?: number) => {
  useAppStore.getState().addNotification({
    type: "error",
    message,
    duration,
  });
};

export const showWarning = (message: string, duration?: number) => {
  useAppStore.getState().addNotification({
    type: "warning",
    message,
    duration,
  });
};

export const showInfo = (message: string, duration?: number) => {
  useAppStore.getState().addNotification({
    type: "info",
    message,
    duration,
  });
};

export default useAppStore;
