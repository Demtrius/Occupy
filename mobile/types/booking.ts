// Booking-related Types

import { User } from "./user";
import { Clique } from "./clique";

export interface Service {
	id: number;
	clique: Clique;
	cliqueName?: string;
	provider: User;
	title: string;
	description: string;
	price?: string;
	durationMinutes: number;
	isActive: boolean;
	bookingsCount?: number;
	createdAt: string;
	updatedAt: string;
}

export interface ServiceDetail extends Service {
	cliqueDetail?: Clique;
	availableSlots?: number;
}

export interface CreateServiceData {
	cliqueId: number;
	title: string;
	description: string;
	price?: string;
	durationMinutes: number;
	isActive?: boolean;
}

export interface Availability {
	id: number;
	clique: Clique;
	cliqueName?: string;
	provider: User;
	date?: string;
	startTime: string;
	endTime: string;
	isRecurring: boolean;
	dayOfWeek?: number;
	dayName?: string;
}

export interface CreateAvailabilityData {
	cliqueId: number;
	date?: string;
	startTime: string;
	endTime: string;
	isRecurring?: boolean;
	dayOfWeek?: number;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
	id: number;
	service: Service | number;
	clique: number;
	cliqueName?: string;
	client: User;
	provider: User;
	date: string;
	startTime: string;
	endTime: string;
	status: BookingStatus;
	notes?: string;
	cancellationReason?: string;
	createdAt: string;
	updatedAt: string;
}

export interface BookingDetail extends Omit<Booking, "service"> {
	service: Service;
	cliqueDetail?: Clique;
}

export interface CreateBookingData {
	serviceId: number;
	date: string;
	startTime: string;
	endTime: string;
	notes?: string;
}

export interface BookingFilter {
	role?: "client" | "provider";
	status?: BookingStatus;
	cliqueId?: number;
	serviceId?: number;
	date?: string;
}

export interface TimeSlot {
	startTime: string;
	endTime: string;
	available: boolean;
	bookingId?: number;
}
