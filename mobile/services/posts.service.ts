import { apiHelpers } from './api';
import { Post, CreatePostData, PaginatedResponse, ApiError } from '../types';

class PostsService {
  /**
   * Get all posts
   */
  async getAllPosts(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Post>> {
    try {
      const response = await apiHelpers.get<PaginatedResponse<Post>>(
        `/api/posts/?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Get all posts error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get post by ID
   */
  async getPostById(postId: number): Promise<Post> {
    try {
      const post = await apiHelpers.get<Post>(`/api/posts/${postId}/`);
      return post;
    } catch (error) {
      console.error('Get post by ID error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new post
   */
  async createPost(data: CreatePostData): Promise<Post> {
    try {
      const post = await apiHelpers.post<Post>('/api/posts/', data);
      return post;
    } catch (error) {
      console.error('Create post error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update a post
   */
  async updatePost(postId: number, data: Partial<CreatePostData>): Promise<Post> {
    try {
      const post = await apiHelpers.patch<Post>(`/api/posts/${postId}/`, data);
      return post;
    } catch (error) {
      console.error('Update post error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: number): Promise<void> {
    try {
      await apiHelpers.delete(`/api/posts/${postId}/`);
    } catch (error) {
      console.error('Delete post error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get posts by clique
   */
  async getPostsByClique(
    cliqueId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Post>> {
    try {
      const response = await apiHelpers.get<PaginatedResponse<Post>>(
        `/api/cliques/${cliqueId}/posts/?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Get posts by clique error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get posts by user
   */
  async getPostsByUser(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Post>> {
    try {
      const response = await apiHelpers.get<PaginatedResponse<Post>>(
        `/api/users/${userId}/posts/?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Get posts by user error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get feed posts (posts from followed users and joined cliques)
   */
  async getFeedPosts(page: number = 1, limit: number = 20): Promise<Post[]> {
    try {
      // Get feed posts from the backend
      const posts = await apiHelpers.get<Post[]>(`/api/posts/feed/`);
      return posts;
    } catch (error) {
      console.error('Get feed posts error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Like a post
   */
  async likePost(postId: number): Promise<void> {
    try {
      await apiHelpers.post(`/api/posts/${postId}/like/`);
    } catch (error) {
      console.error('Like post error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: number): Promise<void> {
    try {
      await apiHelpers.delete(`/api/posts/${postId}/like/`);
    } catch (error) {
      console.error('Unlike post error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Search posts
   */
  async searchPosts(query: string, page: number = 1, limit: number = 20): Promise<Post[]> {
    try {
      const posts = await apiHelpers.get<Post[]>(
        `/api/posts/?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      );
      return posts;
    } catch (error) {
      console.error('Search posts error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get nearby posts
   */
  async getNearbyPosts(
    latitude: number,
    longitude: number,
    radius: number = 10,
    limit: number = 20
  ): Promise<Post[]> {
    try {
      const posts = await apiHelpers.get<Post[]>(
        `/api/posts/nearby/?lat=${latitude}&lng=${longitude}&radius=${radius}&limit=${limit}`
      );
      return posts;
    } catch (error) {
      console.error('Get nearby posts error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Report a post
   */
  async reportPost(postId: number, reason: string): Promise<void> {
    try {
      await apiHelpers.post(`/api/posts/${postId}/report/`, { reason });
    } catch (error) {
      console.error('Report post error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: any): ApiError {
    if (error.message && error.status) {
      return error as ApiError;
    }

    if (error.response?.data) {
      const data = error.response.data;

      if (data.detail) {
        return {
          message: data.detail,
          status: error.response.status,
        };
      }

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
          message: messages || 'Post operation failed',
          status: error.response.status,
          details: data,
        };
      }
    }

    return {
      message: error.message || 'An error occurred with posts',
      status: error.status || 500,
    };
  }
}

// Export singleton instance
export const postsService = new PostsService();
export default postsService;
