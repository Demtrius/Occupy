import { apiHelpers } from "./api";
import { Post, CreatePostData, PaginatedResponse, ApiError } from "../types";

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
