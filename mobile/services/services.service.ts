/**
 * Services Service
 *
 * Service for managing business services.
 */

import { apiHelpers } from './api'
import {
	Service,
	ServiceDetail,
	CreateServiceData,
	ApiError,
	PaginatedResponse,
} from '../types'

class ServicesService {
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
				`/api/v1/services/?clique_id=${cliqueId}`
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
				`/api/v1/services/${serviceId}/`
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
			const service = await apiHelpers.post<Service>('/api/v1/services/', data)
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
				`/api/v1/services/${serviceId}/`,
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
			await apiHelpers.delete(`/api/v1/services/${serviceId}/`)
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
			let url = `/api/v1/services/?search=${encodeURIComponent(query)}`
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
					message: messages || 'Service operation failed',
					status: error.response.status,
					details: data,
				}
			}
		}

		return {
			message: error.message || 'An error occurred with service operation',
			status: error.status || 500,
		}
	}
}

// Export singleton instance
export const servicesService = new ServicesService()
export default servicesService