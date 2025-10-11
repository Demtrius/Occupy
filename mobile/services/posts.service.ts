import { apiHelpers } from "./api";
import {
	Post,
	CreatePostData,
	PaginatedResponse,
	ApiError,
	Like,
	CreateLikeData,
	Comment,
	CreateCommentData,
	UpdateCommentData,
} from "../types";

class PostsService {
	/**
	 * Get all posts
	 */
	async getAllPosts(
		page: number = 1,
		limit: number = 20,
	): Promise<PaginatedResponse<Post>> {
		try {
			const response = await apiHelpers.get<PaginatedResponse<Post>>(
				`/api/v1/posts/?page=${page}&limit=${limit}`,
			);
			return response;
		} catch (error) {
			console.error("Get all posts error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Get post by ID
	 */
	async getPostById(postId: number): Promise<Post> {
		try {
			const post = await apiHelpers.get<Post>(`/api/v1/posts/${postId}/`);
			return post;
		} catch (error) {
			console.error("Get post by ID error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Create a new post
	 */
	async createPost(data: CreatePostData): Promise<Post> {
		try {
			const post = await apiHelpers.post<Post>("/api/v1/posts/create/", data);
			return post;
		} catch (error) {
			console.error("Create post error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Update a post
	 */
	async updatePost(
		postId: number,
		data: Partial<CreatePostData>,
	): Promise<Post> {
		try {
			const post = await apiHelpers.patch<Post>(
				`/api/v1/posts/${postId}/update/`,
				data,
			);
			return post;
		} catch (error) {
			console.error("Update post error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Delete a post
	 */
	async deletePost(postId: number): Promise<void> {
		try {
			await apiHelpers.delete(`/api/v1/posts/${postId}/delete/`);
		} catch (error) {
			console.error("Delete post error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Get posts by clique
	 */
	async getPostsByClique(
		cliqueId: number,
		page: number = 1,
		limit: number = 20,
	): Promise<PaginatedResponse<Post>> {
		try {
			const response = await apiHelpers.get<PaginatedResponse<Post>>(
				`/api/v1/cliques/${cliqueId}/posts/?page=${page}&limit=${limit}`,
			);
			return response;
		} catch (error) {
			console.error("Get posts by clique error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Get feed posts (posts from followed users and joined cliques)
	 */
	async getFeedPosts(
		page: number = 1,
		limit: number = 20,
	): Promise<PaginatedResponse<Post>> {
		try {
			// Get feed posts from the backend with pagination
			const response = await apiHelpers.get<PaginatedResponse<Post>>(
				`/api/v1/posts/feed/?page=${page}&limit=${limit}`,
			);

			return response;
		} catch (error) {
			console.error("Get feed posts error:", error);
			throw this.handleError(error);
		}
	}

	// ==================== LIKES ====================

	/**
	 * Like a post
	 */
	async likePost(
		postId: number,
	): Promise<{ likesCount: number; isLiked: boolean }> {
		try {
			const response = await apiHelpers.post<{
				likesCount: number;
				isLiked: boolean;
			}>(`/api/v1/posts/${postId}/like/`);
			return response;
		} catch (error) {
			console.error("Like post error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Unlike a post
	 */
	async unlikePost(
		postId: number,
	): Promise<{ likesCount: number; isLiked: boolean }> {
		try {
			const response = await apiHelpers.delete<{
				likesCount: number;
				isLiked: boolean;
			}>(`/api/v1/posts/${postId}/like/`);
			return response;
		} catch (error) {
			console.error("Unlike post error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Get likes for a post
	 */
	async getPostLikes(postId: number): Promise<Like[]> {
		try {
			const likes = await apiHelpers.get<Like[]>(
				`/api/v1/posts/${postId}/likes/`,
			);
			return likes;
		} catch (error) {
			console.error("Get post likes error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Check if user liked a post
	 */
	async isPostLiked(postId: number): Promise<boolean> {
		try {
			const response = await apiHelpers.get<{ isLiked: boolean }>(
				`/api/v1/posts/${postId}/is-liked/`,
			);
			return response.isLiked;
		} catch (error) {
			console.error("Check post liked error:", error);
			return false;
		}
	}

	// ==================== COMMENTS ====================

	/**
	 * Get comments for a post
	 */
	async getPostComments(postId: number): Promise<Comment[]> {
		try {
			const comments = await apiHelpers.get<Comment[]>(
				`/api/v1/posts/${postId}/comments/`,
			);
			return comments;
		} catch (error) {
			console.error("Get post comments error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Create a comment
	 */
	async createComment(data: CreateCommentData): Promise<Comment> {
		try {
			const { postId, ...rest } = data;
			// The backend now expects 'content' instead of 'body'
			const payload = { content: rest.content };

			const comment = await apiHelpers.post<Comment>(
				`/api/v1/posts/${postId}/comments/add/`,
				payload,
			);
			return comment;
		} catch (error) {
			console.error("Create comment error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Update a comment
	 */
	async updateComment(
		commentId: number,
		data: UpdateCommentData,
	): Promise<Comment> {
		try {
			const comment = await apiHelpers.patch<Comment>(
				`/api/v1/comments/${commentId}/update/`,
				data,
			);
			return comment;
		} catch (error) {
			console.error("Update comment error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Delete a comment
	 */
	async deleteComment(commentId: number): Promise<void> {
		try {
			await apiHelpers.delete(`/api/v1/comments/${commentId}/delete/`);
		} catch (error) {
			console.error("Delete comment error:", error);
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

			if (typeof data === "object") {
				const messages = Object.entries(data)
					.map(([key, value]) => {
						if (Array.isArray(value)) {
							return `${key}: ${value.join(", ")}`;
						}
						return `${key}: ${value}`;
					})
					.join("\n");

				return {
					message: messages || "Post operation failed",
					status: error.response.status,
					details: data,
				};
			}
		}

		return {
			message: error.message || "An error occurred with posts",
			status: error.status || 500,
		};
	}
}

// Export singleton instance
export const postsService = new PostsService();
export default postsService;
