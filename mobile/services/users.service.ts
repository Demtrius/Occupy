/**
 * Users Service
 *
 * Service for managing user-related API calls including profiles,
 * followers, following, and user search functionality.
 */

import { apiHelpers } from './api';
import { User } from '../types';

/**
 * Interface for user list response
 */
interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

/**
 * Interface for follow/unfollow response
 */
interface FollowResponse {
  message: string;
  is_following: boolean;
}

/**
 * Interface for user update data
 */
interface UserUpdateData {
  first_name?: string;
  last_name?: string;
  bio?: string;
  occupations?: string;
  profile_image?: string;
  private_account?: boolean;
}

class UsersService {
  /**
   * Get all users with optional pagination
   */
  async getAllUsers(page: number = 1, limit: number = 20): Promise<User[]> {
    try {
      const response = await apiHelpers.get<UserListResponse>(
        `/api/users/?page=${page}&limit=${limit}`
      );
      return response.results || response as any;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User> {
    try {
      const user = await apiHelpers.get<User>(`/api/users/${userId}/`);
      return user;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  /**
   * Get user profile by username
   */
  async getUserByUsername(username: string): Promise<User> {
    try {
      const user = await apiHelpers.get<User>(`/api/users/username/${username}/`);
      return user;
    } catch (error) {
      console.error('Get user by username error:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user's profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const user = await apiHelpers.get<User>('/api/auth/users/me/');
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: UserUpdateData): Promise<User> {
    try {
      const user = await apiHelpers.patch<User>('/api/auth/users/me/', data);
      return user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Search users by query
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await apiHelpers.get<UserListResponse>(
        `/api/users/search/?q=${encodeURIComponent(query)}`
      );
      return response.results || response as any;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  /**
   * Get user's followers
   */
  async getUserFollowers(userId: number): Promise<User[]> {
    try {
      const response = await apiHelpers.get<User[]>(
        `/api/users/${userId}/followers/`
      );
      return response;
    } catch (error) {
      console.error('Get user followers error:', error);
      throw error;
    }
  }

  /**
   * Get user's following
   */
  async getUserFollowing(userId: number): Promise<User[]> {
    try {
      const response = await apiHelpers.get<User[]>(
        `/api/users/${userId}/following/`
      );
      return response;
    } catch (error) {
      console.error('Get user following error:', error);
      throw error;
    }
  }

  /**
   * Follow a user
   */
  async followUser(userId: number): Promise<FollowResponse> {
    try {
      const response = await apiHelpers.post<FollowResponse>(
        `/api/users/${userId}/follow/`
      );
      return response;
    } catch (error) {
      console.error('Follow user error:', error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: number): Promise<FollowResponse> {
    try {
      const response = await apiHelpers.delete<FollowResponse>(
        `/api/users/${userId}/follow/`
      );
      return response;
    } catch (error) {
      console.error('Unfollow user error:', error);
      throw error;
    }
  }

  /**
   * Check if current user is following another user
   */
  async isFollowing(userId: number): Promise<boolean> {
    try {
      const response = await apiHelpers.get<{ is_following: boolean }>(
        `/api/users/${userId}/is-following/`
      );
      return response.is_following;
    } catch (error) {
      console.error('Check following error:', error);
      return false;
    }
  }

  /**
   * Get user's posts
   */
  async getUserPosts(userId: number): Promise<any[]> {
    try {
      const response = await apiHelpers.get<any[]>(
        `/api/users/${userId}/posts/`
      );
      return response;
    } catch (error) {
      console.error('Get user posts error:', error);
      throw error;
    }
  }

  /**
   * Get suggested users to follow
   */
  async getSuggestedUsers(limit: number = 10): Promise<User[]> {
    try {
      const response = await apiHelpers.get<User[]>(
        `/api/users/suggested/?limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Get suggested users error:', error);
      throw error;
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: number): Promise<{ message: string }> {
    try {
      const response = await apiHelpers.post<{ message: string }>(
        `/api/users/${userId}/block/`
      );
      return response;
    } catch (error) {
      console.error('Block user error:', error);
      throw error;
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: number): Promise<{ message: string }> {
    try {
      const response = await apiHelpers.delete<{ message: string }>(
        `/api/users/${userId}/block/`
      );
      return response;
    } catch (error) {
      console.error('Unblock user error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: number): Promise<{
    followers_count: number;
    following_count: number;
    posts_count: number;
    cliques_count: number;
  }> {
    try {
      const response = await apiHelpers.get(
        `/api/users/${userId}/stats/`
      );
      return response;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const usersService = new UsersService();
export default usersService;
