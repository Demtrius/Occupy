/**
 * Availability Service
 *
 * Service for managing business availability slots.
 */

import { apiHelpers } from './api'
import {
	Availability,
	CreateAvailabilityData,
	TimeSlot,
	ApiError,
	PaginatedResponse,
} from '../types'

class AvailabilityService {
	/**
	 * Get availability slots
	 */
	async getAvailability(
		cliqueId?: number,
		startDate?: string,
		endDate?: string
	): Promise<Availability[]> {
		try {
			let url = '/api/v1/availability/'
			const params = new URLSearchParams()

			if (cliqueId) params.append('clique_id', cliqueId.toString())
			if (startDate) params.append('start_date', startDate)
			if (endDate) params.append('end_date', endDate)

			if (params.toString()) {
				url += `?${params.toString()}`
			}

			const availability = await apiHelpers.get<Availability[]>(url)
			return availability
		} catch (error) {
			console.error('Get availability error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Get availability for a specific clique
	 */
	async getCliqueAvailability(
		cliqueId: number,
		startDate?: string,
		endDate?: string
	): Promise<Availability[]> {
		try {
			let url = `/api/v1/availability/?clique_id=${cliqueId}`
			if (startDate) url += `&start_date=${startDate}`
			if (endDate) url += `&end_date=${endDate}`

			const response = await apiHelpers.get<PaginatedResponse<Availability>>(url)
			return response.results
		} catch (error) {
			console.error('Get clique availability error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Get availability by ID
	 */
	async getAvailabilityById(availabilityId: number): Promise<Availability> {
		try {
			const availability = await apiHelpers.get<Availability>(
				`/api/v1/availability/${availabilityId}/`
			)
			return availability
		} catch (error) {
			console.error('Get availability by ID error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Create availability slot
	 */
	async createAvailability(
		data: CreateAvailabilityData
	): Promise<Availability> {
		try {
			const availability = await apiHelpers.post<Availability>(
				'/api/v1/availability/',
				{ ...data, clique: data.cliqueId }
			)
			return availability
		} catch (error) {
			console.error('Create availability error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Update availability slot
	 */
	async updateAvailability(
		availabilityId: number,
		data: Partial<CreateAvailabilityData>
	): Promise<Availability> {
		try {
			const availability = await apiHelpers.patch<Availability>(
				`/api/v1/availability/${availabilityId}/`,
				data
			)
			return availability
		} catch (error) {
			console.error('Update availability error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Delete availability slot
	 */
	async deleteAvailability(availabilityId: number): Promise<void> {
		try {
			await apiHelpers.delete(`/api/v1/availability/${availabilityId}/`)
		} catch (error) {
			console.error('Delete availability error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Get available time slots for a service on a specific date
	 */
	async getAvailableTimeSlots(
		serviceId: number,
		date: string
	): Promise<TimeSlot[]> {
		try {
			// This would need a backend endpoint to calculate available slots
			// For now, return empty array
			return []
		} catch (error) {
			console.error('Get available time slots error:', error)
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
					message: messages || 'Availability operation failed',
					status: error.response.status,
					details: data,
				}
			}
		}

		return {
			message: error.message || 'An error occurred with availability operation',
			status: error.status || 500,
		}
	}
}

// Export singleton instance
export const availabilityService = new AvailabilityService()
export default availabilityService