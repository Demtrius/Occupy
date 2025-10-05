import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { tokenManager } from '../services/api';
import { AuthState } from '../types/store';
import { User, AuthTokens, ApiError, LoginCredentials, RegisterData } from '../types';

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isLoggedIn: false,
  isLoading: false,
  isInitializing: true,
  user: null,
  tokens: null,
  error: null,

  // Initialize authentication state from storage
  initialize: async () => {
    try {
      set({ isInitializing: true, error: null });

      // Get stored tokens
      const accessToken = await tokenManager.getAccessToken();
      const refreshToken = await tokenManager.getRefreshToken();

      if (!accessToken || !refreshToken) {
        set({ isLoggedIn: false, isInitializing: false });
        return;
      }

      // Set tokens
      set({
        tokens: {
          access: accessToken,
          refresh: refreshToken,
        },
      });

      // Try to get user data
      const storedUser = await tokenManager.getUser();

      if (storedUser) {
        set({
          user: storedUser,
          isLoggedIn: true,
          isInitializing: false,
        });
      } else {
        // Fetch user from API
        const user = await authService.getCurrentUser();
        if (user) {
          await tokenManager.saveUser(user);
          set({
            user,
            isLoggedIn: true,
            isInitializing: false,
          });
        } else {
          // Clear invalid tokens
          await tokenManager.clearTokens();
          set({
            isLoggedIn: false,
            tokens: null,
            isInitializing: false,
          });
        }
      }
    } catch (error) {
      console.error('Initialize auth error:', error);
      await tokenManager.clearTokens();
      set({
        isLoggedIn: false,
        user: null,
        tokens: null,
        isInitializing: false,
        error: 'Failed to initialize authentication',
      });
    }
  },

  // Login action
  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authService.login(credentials);

      set({
        isLoggedIn: true,
        user: response.user || null,
        tokens: {
          access: response.access,
          refresh: response.refresh,
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoggedIn: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: apiError.message || 'Login failed',
      });
      throw error;
    }
  },

  // Register action
  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authService.register(data);

      set({
        isLoggedIn: true,
        user: response.user || null,
        tokens: {
          access: response.access,
          refresh: response.refresh,
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoggedIn: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: apiError.message || 'Registration failed',
      });
      throw error;
    }
  },

  // Logout action
  logout: async () => {
    try {
      set({ isLoading: true, error: null });

      await authService.logout();

      set({
        isLoggedIn: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state even if API call fails
      set({
        isLoggedIn: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: null,
      });
    }
  },

  // Refresh token action
  refreshToken: async () => {
    try {
      const newToken = await authService.refreshAccessToken();

      if (newToken) {
        const refreshToken = await tokenManager.getRefreshToken();
        if (refreshToken) {
          set({
            tokens: {
              access: newToken,
              refresh: refreshToken,
            },
          });
        }
      } else {
        // Refresh failed, logout
        await get().logout();
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      await get().logout();
    }
  },

  // Update user profile
  updateProfile: async (data: Partial<User>) => {
    try {
      set({ isLoading: true, error: null });

      const updatedUser = await authService.updateProfile(data);

      set({
        user: updatedUser,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({
        isLoading: false,
        error: apiError.message || 'Failed to update profile',
      });
      throw error;
    }
  },

  // Check authentication status
  checkAuth: async (): Promise<boolean> => {
    try {
      const isAuthenticated = await authService.isAuthenticated();

      if (!isAuthenticated) {
        set({
          isLoggedIn: false,
          user: null,
          tokens: null,
        });
      }

      return isAuthenticated;
    } catch (error) {
      console.error('Check auth error:', error);
      return false;
    }
  },

  // Set user
  setUser: (user: User | null) => {
    set({ user });
    if (user) {
      tokenManager.saveUser(user);
    }
  },

  // Set tokens
  setTokens: (tokens: AuthTokens | null) => {
    set({ tokens });
    if (tokens) {
      tokenManager.setTokens(tokens);
    } else {
      tokenManager.clearTokens();
    }
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useAuthStore;
