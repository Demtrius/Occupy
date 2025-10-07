/**
 * Social Service
 *
 * Service for managing likes, comments, and reviews
 */

import { apiHelpers } from './api'
import {
	Like,
	CreateLikeData,
	Comment,
	CreateCommentData,
	UpdateCommentData,
	Review,
	CreateReviewData,
	UpdateReviewData,
	ApiError,
} from '../types'

class SocialService {
	// ==================== LIKES ====================

	/**
	 * Like a post
	 */
	async likePost(
		postId: number
	): Promise<{ likesCount: number; isLiked: boolean }> {
		try {
			const response = await apiHelpers.post<{
				likesCount: number
				isLiked: boolean
			}>(`/api/posts/${postId}/like/`)
			return response
		} catch (error) {
			console.error('Like post error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Unlike a post
	 */
	async unlikePost(
		postId: number
	): Promise<{ likesCount: number; isLiked: boolean }> {
		try {
			const response = await apiHelpers.delete<{
				likesCount: number
				isLiked: boolean
			}>(`/api/posts/${postId}/unlike/`)
			return response
		} catch (error) {
			console.error('Unlike post error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Get likes for a post
	 */
	async getPostLikes(postId: number): Promise<Like[]> {
		try {
			const likes = await apiHelpers.get<Like[]>(`/api/posts/${postId}/likes/`)
			return likes
		} catch (error) {
			console.error('Get post likes error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Check if user liked a post
	 */
	async isPostLiked(postId: number): Promise<boolean> {
		try {
			const response = await apiHelpers.get<{ isLiked: boolean }>(
				`/api/posts/${postId}/is-liked/`
			)
			return response.isLiked
		} catch (error) {
			console.error('Check post liked error:', error)
			return false
		}
	}

	// ==================== COMMENTS ====================

	/**
	 * Get comments for a post
	 */
	async getPostComments(postId: number): Promise<Comment[]> {
		try {
			const comments = await apiHelpers.get<Comment[]>(
				`/api/posts/${postId}/comments/`
			)
			return comments
		} catch (error) {
			console.error('Get post comments error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Create a comment
	 */
 	async createComment(data: CreateCommentData): Promise<Comment> {
 		try {
 			const { postId, ...rest } = data
 			const payload = {
 				post: postId,
 				content: rest.content,
 			}
 			const comment = await apiHelpers.post<Comment>(
 				`/api/posts/${postId}/add_comment/`,
 				payload
 			)
 			return comment
 		} catch (error) {
 			console.error('Create comment error:', error)
 			throw this.handleError(error)
 		}
 	}

	/**
	 * Update a comment
	 */
	async updateComment(
		commentId: number,
		data: UpdateCommentData
	): Promise<Comment> {
		try {
			const comment = await apiHelpers.patch<Comment>(
				`/api/comments/${commentId}/`,
				data
			)
			return comment
		} catch (error) {
			console.error('Update comment error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Delete a comment
	 */
	async deleteComment(commentId: number): Promise<void> {
		try {
			await apiHelpers.delete(`/api/comments/${commentId}/`)
		} catch (error) {
			console.error('Delete comment error:', error)
			throw this.handleError(error)
		}
	}

	// ==================== REVIEWS ====================

	/**
	 * Get reviews for a clique
	 */
	async getCliqueReviews(cliqueId: number): Promise<Review[]> {
		try {
			const reviews = await apiHelpers.get<Review[]>(
				`/api/reviews/?clique=${cliqueId}`
			)
			return reviews
		} catch (error) {
			console.error('Get clique reviews error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Get review by booking ID
	 */
	async getReviewByBooking(bookingId: number): Promise<Review | null> {
		try {
			const reviews = await apiHelpers.get<Review[]>(
				`/api/reviews/?booking=${bookingId}`
			)
			return reviews.length > 0 ? reviews[0] : null
		} catch (error) {
			console.error('Get review by booking error:', error)
			return null
		}
	}

	/**
	 * Get review by ID
	 */
	async getReviewById(reviewId: number): Promise<Review> {
		try {
			const review = await apiHelpers.get<Review>(`/api/reviews/${reviewId}/`)
			return review
		} catch (error) {
			console.error('Get review by ID error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Create a review
	 */
	async createReview(data: CreateReviewData): Promise<Review> {
		try {
			const { bookingId, ...rest } = data
			const payload = {
				booking: bookingId,
				...rest,
			}
			const review = await apiHelpers.post<Review>('/api/reviews/', payload)
			return review
		} catch (error) {
			console.error('Create review error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Update a review
	 */
	async updateReview(
		reviewId: number,
		data: UpdateReviewData
	): Promise<Review> {
		try {
			const review = await apiHelpers.patch<Review>(
				`/api/reviews/${reviewId}/`,
				data
			)
			return review
		} catch (error) {
			console.error('Update review error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Delete a review
	 */
	async deleteReview(reviewId: number): Promise<void> {
		try {
			await apiHelpers.delete(`/api/reviews/${reviewId}/`)
		} catch (error) {
			console.error('Delete review error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Get user's reviews (reviews they've written)
	 */
	async getUserReviews(): Promise<Review[]> {
		try {
			const reviews = await apiHelpers.get<Review[]>('/api/reviews/?user=me')
			return reviews
		} catch (error) {
			console.error('Get user reviews error:', error)
			throw this.handleError(error)
		}
	}

	// ==================== HELPER METHODS ====================

	/**
	 * Handle errors
	 */
	private handleError(error: any): ApiError {
		if (error.message && error.status) {
			return error as ApiError
		}

		if (error.response?.data) {
			const data = error.response.data

			if (data.detail) {
				return {
					message: data.detail,
					status: error.response.status,
				}
			}

			if (typeof data === 'object') {
				const messages = Object.entries(data)
					.map(([key, value]) => {
						if (Array.isArray(value)) {
							return `${key}: ${value.join(', ')}`
						}
						return `${key}: ${value}`
					})
					.join('\n')

				return {
					message: messages || 'Social operation failed',
					status: error.response.status,
					details: data,
				}
			}
		}

		return {
			message: error.message || 'An error occurred with social operation',
			status: error.status || 500,
		}
	}
}

// Export singleton instance
export const socialService = new SocialService()
export default socialService
