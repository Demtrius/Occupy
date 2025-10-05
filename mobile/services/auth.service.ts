import api, { tokenManager, apiHelpers } from './api';
import {
  AuthTokens,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  ApiError,
} from '../types';

class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiHelpers.post<AuthResponse>(
        '/auth/jwt/create/',
        credentials
      );

      // Save tokens
      if (response.access && response.refresh) {
        await tokenManager.setTokens({
          access: response.access,
          refresh: response.refresh,
        });
      }

      // Fetch and save user profile
      if (response.access) {
        const user = await this.getCurrentUser();
        if (user) {
          await tokenManager.saveUser(user);
          response.user = user;
        }
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Register the user
      const registerResponse = await apiHelpers.post('/auth/users/', data);

      // Auto-login after registration
      const loginResponse = await this.login({
        email: data.email,
        password: data.password,
      });

      return loginResponse;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      // Optionally call backend logout endpoint
      // await apiHelpers.post('/auth/logout/');

      // Clear tokens and user data
      await tokenManager.clearTokens();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens even if API call fails
      await tokenManager.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await apiHelpers.get<User>('/auth/users/me/');
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await tokenManager.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiHelpers.post<{ access: string }>(
        '/auth/jwt/refresh/',
        { refresh: refreshToken }
      );

      if (response.access) {
        const currentRefresh = await tokenManager.getRefreshToken();
        await tokenManager.setTokens({
          access: response.access,
          refresh: currentRefresh || refreshToken,
        });

        return response.access;
      }

      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens if refresh fails
      await tokenManager.clearTokens();
      return null;
    }
  }

  /**
   * Verify if token is valid
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      await apiHelpers.post('/auth/jwt/verify/', { token });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await tokenManager.getAccessToken();

      if (!accessToken) {
        return false;
      }

      // Verify token is still valid
      const isValid = await this.verifyToken(accessToken);

      if (!isValid) {
        // Try to refresh
        const newToken = await this.refreshAccessToken();
        return !!newToken;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const user = await apiHelpers.patch<User>('/auth/users/me/', data);
      await tokenManager.saveUser(user);
      return user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiHelpers.post('/auth/users/set_password/', {
        current_password: currentPassword,
        new_password: newPassword,
      });
    } catch (error) {
      console.error('Change password error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiHelpers.post('/auth/users/reset_password/', { email });
    } catch (error) {
      console.error('Request password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(uid: string, token: string, newPassword: string): Promise<void> {
    try {
      await apiHelpers.post('/auth/users/reset_password_confirm/', {
        uid,
        token,
        new_password: newPassword,
      });
    } catch (error) {
      console.error('Confirm password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get stored user from local storage
   */
  async getStoredUser(): Promise<User | null> {
    try {
      return await tokenManager.getUser();
    } catch (error) {
      console.error('Get stored user error:', error);
      return null;
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): ApiError {
    if (error.message && error.status) {
      return error as ApiError;
    }

    // Handle different error formats
    if (error.response?.data) {
      const data = error.response.data;

      // Handle field-specific errors
      if (data.detail) {
        return {
          message: data.detail,
          status: error.response.status,
        };
      }

      // Handle validation errors
      if (typeof data === 'object') {
        const messages = Object.entries(data)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join('\n');

        return {
          message: messages || 'Authentication failed',
          status: error.response.status,
          details: data,
        };
      }
    }

    return {
      message: error.message || 'An error occurred during authentication',
      status: error.status || 500,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
