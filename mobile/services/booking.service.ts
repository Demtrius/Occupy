/**
 * Booking Service
 *
 * Service for managing bookings, services, and availability for business cliques.
 */

import { apiHelpers } from './api'
import {
	Service,
	ServiceDetail,
	CreateServiceData,
	Availability,
	CreateAvailabilityData,
	Booking,
	BookingDetail,
	CreateBookingData,
	BookingFilter,
	TimeSlot,
	ApiError,
	PaginatedResponse,
} from '../types'

class BookingService {
	// ==================== SERVICES ====================

	/**
	 * Get all services with optional filtering
	 */
	async getAllServices(
		cliqueId?: number,
		isActive?: boolean
	): Promise<Service[]> {
		try {
			let url = '/api/services/'
			const params = new URLSearchParams()

			if (cliqueId) params.append('clique_id', cliqueId.toString())
			if (isActive !== undefined)
				params.append('is_active', isActive.toString())

			if (params.toString()) {
				url += `?${params.toString()}`
			}

			const services = await apiHelpers.get<Service[]>(url)
			return services
		} catch (error) {
			console.error('Get all services error:', error)
			throw this.handleError(error)
		}
	}

  /**
   * Get services for a specific clique
   */
  async getCliqueServices(cliqueId: number): Promise<Service[]> {
    try {
      const response = await apiHelpers.get<PaginatedResponse<Service>>(
        `/api/services/?clique_id=${cliqueId}`
      )
      return response.results
    } catch (error) {
      console.error('Get clique services error:', error)
      throw this.handleError(error)
    }
  }

	/**
	 * Get service by ID
	 */
	async getServiceById(serviceId: number): Promise<ServiceDetail> {
		try {
			const service = await apiHelpers.get<ServiceDetail>(
				`/api/services/${serviceId}/`
			)
			return service
		} catch (error) {
			console.error('Get service by ID error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Create a new service
	 */
	async createService(data: CreateServiceData): Promise<Service> {
		try {
			// Transform cliqueId to clique for backend
			const service = await apiHelpers.post<Service>('/api/services/', data)
			return service
		} catch (error) {
			console.error('Create service error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Update a service
	 */
	async updateService(
		serviceId: number,
		data: Partial<CreateServiceData>
	): Promise<Service> {
		try {
			const service = await apiHelpers.patch<Service>(
				`/api/services/${serviceId}/`,
				data
			)
			return service
		} catch (error) {
			console.error('Update service error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Delete a service
	 */
	async deleteService(serviceId: number): Promise<void> {
		try {
			await apiHelpers.delete(`/api/services/${serviceId}/`)
		} catch (error) {
			console.error('Delete service error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Search services
	 */
	async searchServices(query: string, cliqueId?: number): Promise<Service[]> {
		try {
			let url = `/api/services/?search=${encodeURIComponent(query)}`
			if (cliqueId) {
				url += `&clique_id=${cliqueId}`
			}
			const services = await apiHelpers.get<Service[]>(url)
			return services
		} catch (error) {
			console.error('Search services error:', error)
			throw this.handleError(error)
		}
	}

	// ==================== AVAILABILITY ====================

	/**
	 * Get availability slots
	 */
	async getAvailability(
		cliqueId?: number,
		startDate?: string,
		endDate?: string
	): Promise<Availability[]> {
		try {
			let url = '/api/availability/'
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
      let url = `/api/availability/?clique_id=${cliqueId}`
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
				`/api/availability/${availabilityId}/`
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
				'/api/availability/',
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
				`/api/availability/${availabilityId}/`,
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
			await apiHelpers.delete(`/api/availability/${availabilityId}/`)
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

	// ==================== BOOKINGS ====================

	/**
	 * Get bookings with optional filtering
	 */
	async getBookings(filter?: BookingFilter): Promise<Booking[]> {
		try {
			let url = '/api/bookings/'
			const params = new URLSearchParams()

			if (filter?.role) params.append('role', filter.role)
			if (filter?.status) params.append('status', filter.status)
			if (filter?.cliqueId)
				params.append('clique_id', filter.cliqueId.toString())
			if (filter?.serviceId)
				params.append('service_id', filter.serviceId.toString())
			if (filter?.date) params.append('date', filter.date)

			if (params.toString()) {
				url += `?${params.toString()}`
			}

			const bookings = await apiHelpers.get<Booking[]>(url)
			return bookings
		} catch (error) {
			console.error('Get bookings error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Get my bookings as a client
	 */
	async getMyBookings(status?: string): Promise<Booking[]> {
		try {
			let url = '/api/v1/bookings/?role=client'
			if (status) url += `&status=${status}`

			const bookings = await apiHelpers.get<Booking[]>(url)
			return bookings
		} catch (error) {
			console.error('Get my bookings error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Get provider bookings (bookings for my services)
	 */
	async getProviderBookings(status?: string): Promise<Booking[]> {
		try {
			let url = '/api/v1/bookings/?role=provider'
			if (status) url += `&status=${status}`

			const bookings = await apiHelpers.get<Booking[]>(url)
			return bookings
		} catch (error) {
			console.error('Get provider bookings error:', error)
			throw this.handleError(error)
		}
	}

  /**
   * Get clique bookings
   */
  async getCliqueBookings(
    cliqueId: number,
    status?: string
  ): Promise<Booking[]> {
    try {
      let url = `/api/v1/bookings/?clique_id=${cliqueId}`
      if (status) url += `&status=${status}`

      const response = await apiHelpers.get<PaginatedResponse<Booking>>(url)
      return response.results
    } catch (error) {
      console.error('Get clique bookings error:', error)
      throw this.handleError(error)
    }
  }

	/**
	 * Get booking by ID
	 */
	async getBookingById(bookingId: number): Promise<BookingDetail> {
		try {
			const booking = await apiHelpers.get<BookingDetail>(
				`/api/v1/bookings/${bookingId}/`
			)
			return booking
		} catch (error) {
			console.error('Get booking by ID error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Create a new booking
	 */
 	async createBooking(data: CreateBookingData): Promise<Booking> {
		try {
			const booking = await apiHelpers.post<Booking>('/api/v1/bookings/', data)
			return booking
		} catch (error) {
			console.error('Create booking error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Update a booking
	 */
	async updateBooking(
		bookingId: number,
		data: Partial<CreateBookingData>
	): Promise<Booking> {
		try {
			const booking = await apiHelpers.patch<Booking>(
				`/api/v1/bookings/${bookingId}/`,
				data
			)
			return booking
		} catch (error) {
			console.error('Update booking error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Confirm a booking (provider only)
	 */
	async confirmBooking(bookingId: number): Promise<BookingDetail> {
		try {
			const booking = await apiHelpers.post<BookingDetail>(
				`/api/v1/bookings/${bookingId}/confirm/`,
				{}
			)
			return booking
		} catch (error) {
			console.error('Confirm booking error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Cancel a booking
	 */
	async cancelBooking(
		bookingId: number,
		reason?: string
	): Promise<BookingDetail> {
		try {
			const booking = await apiHelpers.post<BookingDetail>(
				`/api/v1/bookings/${bookingId}/cancel/`,
				{ reason }
			)
			return booking
		} catch (error) {
			console.error('Cancel booking error:', error)
			throw this.handleError(error)
		}
	}

	/**
	 * Complete a booking (provider only)
	 */
	async completeBooking(bookingId: number): Promise<BookingDetail> {
		try {
			const booking = await apiHelpers.post<BookingDetail>(
				`/api/v1/bookings/${bookingId}/complete/`,
				{}
			)
			return booking
		} catch (error) {
			console.error('Complete booking error:', error)
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
					message: messages || 'Booking operation failed',
					status: error.response.status,
					details: data,
				}
			}
		}

		return {
			message: error.message || 'An error occurred with booking operation',
			status: error.status || 500,
		}
	}
}

// Export singleton instance
export const bookingService = new BookingService()
export default bookingService
