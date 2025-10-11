/**
 * Booking Service
 *
 * Service for managing bookings for business cliques.
 */

import { apiHelpers } from "./api";
import {
	Booking,
	BookingDetail,
	CreateBookingData,
	BookingFilter,
	ApiError,
	PaginatedResponse,
	Review,
	CreateReviewData,
	UpdateReviewData,
} from "../types";

class BookingService {
	// ==================== BOOKINGS ====================

	/**
	 * Get bookings with optional filtering
	 */
	async getBookings(filter?: BookingFilter): Promise<Booking[]> {
		try {
			let url = "/api/v1/bookings/";
			const params = new URLSearchParams();

			if (filter?.role) params.append("role", filter.role);
			if (filter?.status) params.append("status", filter.status);
			if (filter?.cliqueId)
				params.append("clique_id", filter.cliqueId.toString());
			if (filter?.serviceId)
				params.append("service_id", filter.serviceId.toString());
			if (filter?.date) params.append("date", filter.date);

			if (params.toString()) {
				url += `?${params.toString()}`;
			}

			const bookings = await apiHelpers.get<Booking[]>(url);
			return bookings;
		} catch (error) {
			console.error("Get bookings error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Get my bookings as a client
	 */
	async getMyBookings(status?: string): Promise<Booking[]> {
		try {
			let url = "/api/v1/bookings/?role=client";
			if (status) url += `&status=${status}`;

			const bookings = await apiHelpers.get<Booking[]>(url);
			return bookings;
		} catch (error) {
			console.error("Get my bookings error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Get provider bookings (bookings for my services)
	 */
	async getProviderBookings(status?: string): Promise<Booking[]> {
		try {
			let url = "/api/v1/bookings/?role=provider";
			if (status) url += `&status=${status}`;

			const bookings = await apiHelpers.get<Booking[]>(url);
			return bookings;
		} catch (error) {
			console.error("Get provider bookings error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Get clique bookings
	 */
	async getCliqueBookings(
		cliqueId: number,
		status?: string,
	): Promise<Booking[]> {
		try {
			let url = `/api/v1/bookings/?clique_id=${cliqueId}`;
			if (status) url += `&status=${status}`;

			const response = await apiHelpers.get<PaginatedResponse<Booking>>(url);
			return response.results;
		} catch (error) {
			console.error("Get clique bookings error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Get booking by ID
	 */
	async getBookingById(bookingId: number): Promise<BookingDetail> {
		try {
			const booking = await apiHelpers.get<BookingDetail>(
				`/api/v1/bookings/${bookingId}/`,
			);
			return booking;
		} catch (error) {
			console.error("Get booking by ID error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Create a new booking
	 */
	async createBooking(data: CreateBookingData): Promise<Booking> {
		try {
			const booking = await apiHelpers.post<Booking>("/api/v1/bookings/", data);
			return booking;
		} catch (error) {
			console.error("Create booking error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Update a booking
	 */
	async updateBooking(
		bookingId: number,
		data: Partial<CreateBookingData>,
	): Promise<Booking> {
		try {
			const booking = await apiHelpers.patch<Booking>(
				`/api/v1/bookings/${bookingId}/`,
				data,
			);
			return booking;
		} catch (error) {
			console.error("Update booking error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Confirm a booking (provider only)
	 */
	async confirmBooking(bookingId: number): Promise<BookingDetail> {
		try {
			const booking = await apiHelpers.post<BookingDetail>(
				`/api/v1/bookings/${bookingId}/confirm/`,
				{},
			);
			return booking;
		} catch (error) {
			console.error("Confirm booking error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Cancel a booking
	 */
	async cancelBooking(
		bookingId: number,
		reason?: string,
	): Promise<BookingDetail> {
		try {
			const booking = await apiHelpers.post<BookingDetail>(
				`/api/v1/bookings/${bookingId}/cancel/`,
				{ reason },
			);
			return booking;
		} catch (error) {
			console.error("Cancel booking error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Complete a booking (provider only)
	 */
	async completeBooking(bookingId: number): Promise<BookingDetail> {
		try {
			const booking = await apiHelpers.post<BookingDetail>(
				`/api/v1/bookings/${bookingId}/complete/`,
				{},
			);
			return booking;
		} catch (error) {
			console.error("Complete booking error:", error);
			throw this.handleError(error);
		}
	}

	// ==================== REVIEWS ====================

	/**
	 * Get reviews for a clique
	 */
	async getCliqueReviews(cliqueId: number): Promise<Review[]> {
		try {
			const reviews = await apiHelpers.get<Review[]>(
				`/api/v1/reviews/?clique_id=${cliqueId}`,
			);
			return reviews;
		} catch (error) {
			console.error("Get clique reviews error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Get review by booking ID
	 */
	async getReviewByBooking(bookingId: number): Promise<Review | null> {
		try {
			const reviews = await apiHelpers.get<Review[]>(
				`/api/v1/reviews/?booking_id=${bookingId}`,
			);
			return reviews.length > 0 ? reviews[0] : null;
		} catch (error) {
			console.error("Get review by booking error:", error);
			return null;
		}
	}

	/**
	 * Get review by ID
	 */
	async getReviewById(reviewId: number): Promise<Review> {
		try {
			const review = await apiHelpers.get<Review>(
				`/api/v1/reviews/${reviewId}/`,
			);
			return review;
		} catch (error) {
			console.error("Get review by ID error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Create a review
	 */
	async createReview(data: CreateReviewData): Promise<Review> {
		try {
			const payload = { booking_id: data.bookingId, ...data };
			const review = await apiHelpers.post<Review>("/api/v1/reviews/", payload);
			return review;
		} catch (error) {
			console.error("Create review error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Update a review
	 */
	async updateReview(
		reviewId: number,
		data: UpdateReviewData,
	): Promise<Review> {
		try {
			const review = await apiHelpers.patch<Review>(
				`/api/v1/reviews/${reviewId}/update/`,
				data,
			);
			return review;
		} catch (error) {
			console.error("Update review error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Delete a review
	 */
	async deleteReview(reviewId: number): Promise<void> {
		try {
			await apiHelpers.delete(`/api/v1/reviews/${reviewId}/delete/`);
		} catch (error) {
			console.error("Delete review error:", error);
			throw this.handleError(error);
		}
	}

	/**
	 * Get user's reviews (reviews they've written)
	 */
	async getUserReviews(): Promise<Review[]> {
		try {
			const reviews = await apiHelpers.get<Review[]>(
				"/api/v1/reviews/?user=me",
			);
			return reviews;
		} catch (error) {
			console.error("Get user reviews error:", error);
			throw this.handleError(error);
		}
	}

	// ==================== HELPER METHODS ====================

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
					message: messages || "Booking operation failed",
					status: error.response.status,
					details: data,
				};
			}
		}

		return {
			message: error.message || "An error occurred with booking operation",
			status: error.status || 500,
		};
	}
}

// Export singleton instance
export const bookingService = new BookingService();
export default bookingService;
