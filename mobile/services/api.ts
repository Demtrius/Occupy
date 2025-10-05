import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens, ApiError } from '../types';
import env from '../config/env';
import { storage } from '../utils/storage';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: env.BACKEND_URL,
  timeout: env.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Token management utilities
export const tokenManager = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async setTokens(tokens: AuthTokens): Promise<void> {
    try {
      await storage.setMultiple([
        [STORAGE_KEYS.ACCESS_TOKEN, tokens.access],
        [STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh],
      ]);
    } catch (error) {
      console.error('Error setting tokens:', error);
      throw error;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await storage.removeMultiple([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },

  async saveUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },
};

// Request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get access token
    const accessToken = await tokenManager.getAccessToken();

    // Add token to headers if available
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Log request in development
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (__DEV__) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Handle network errors
    if (!error.response) {
      console.error('[API Network Error]', error.message);
      const apiError: ApiError = {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
      return Promise.reject(apiError);
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenManager.getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt to refresh the token
        const response = await axios.post(
          `${env.BACKEND_URL}/auth/jwt/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;

        // Save new access token
        await tokenManager.setTokens({
          access,
          refresh: refreshToken,
        });

        // Update authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Process queued requests
        processQueue(null, access);
        isRefreshing = false;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and logout
        processQueue(refreshError, null);
        isRefreshing = false;
        await tokenManager.clearTokens();

        const apiError: ApiError = {
          message: 'Session expired. Please login again.',
          status: 401,
          code: 'TOKEN_REFRESH_FAILED',
        };

        return Promise.reject(apiError);
      }
    }

    // Handle other errors
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      code: error.code,
      details: error.response?.data?.details,
    };

    console.error('[API Error]', apiError);
    return Promise.reject(apiError);
  }
);

// API helper methods
export const apiHelpers = {
  async get<T = any>(url: string, config = {}): Promise<T> {
    const response = await api.get<T>(url, config);
    return response.data;
  },

  async post<T = any>(url: string, data?: any, config = {}): Promise<T> {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },

  async put<T = any>(url: string, data?: any, config = {}): Promise<T> {
    const response = await api.put<T>(url, data, config);
    return response.data;
  },

  async patch<T = any>(url: string, data?: any, config = {}): Promise<T> {
    const response = await api.patch<T>(url, data, config);
    return response.data;
  },

  async delete<T = any>(url: string, config = {}): Promise<T> {
    const response = await api.delete<T>(url, config);
    return response.data;
  },
};

export default api;
