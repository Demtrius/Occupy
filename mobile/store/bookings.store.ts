import { create } from "zustand";
import { bookingService } from "../services/booking.service";
import { showError } from "./app.store";
import {
	Booking,
	BookingDetail,
	BookingFilter,
	CreateBookingData,
	BookingStatus,
} from "../types";

interface BookingsState {
	// State
	bookings: Booking[];
	loading: boolean;
	refreshing: boolean;

	// Actions - Bookings
	fetchBookings: (filter?: BookingFilter) => Promise<void>;
	fetchMyBookings: (status?: BookingStatus) => Promise<void>;
	fetchProviderBookings: (status?: BookingStatus) => Promise<void>;
	createBooking: (data: CreateBookingData) => Promise<Booking>;
	updateBooking: (
		bookingId: number,
		data: Partial<CreateBookingData>,
	) => Promise<void>;
	confirmBooking: (bookingId: number) => Promise<void>;
	cancelBooking: (bookingId: number, reason?: string) => Promise<void>;
	completeBooking: (bookingId: number) => Promise<void>;
	getBookingById: (bookingId: number) => Promise<BookingDetail>;

	// Utility actions
	reset: () => void;
}

const initialState = {
	bookings: [],
	loading: false,
	refreshing: false,
};

export const useBookingsStore = create<BookingsState>((set, get) => ({
	...initialState,

	// Bookings actions
	fetchBookings: async (filter) => {
		try {
			set({ loading: true });
			const bookings = await bookingService.getBookings(filter);
			set({ bookings, loading: false });
		} catch (error) {
			console.error("Error fetching bookings:", error);
			showError("Failed to load bookings");
			set({ loading: false });
		}
	},

	fetchMyBookings: async (status) => {
		try {
			set({ loading: true });
			const bookings = await bookingService.getMyBookings(status);
			set({ bookings, loading: false });
		} catch (error) {
			console.error("Error fetching my bookings:", error);
			showError("Failed to load your bookings");
			set({ loading: false });
		}
	},

	fetchProviderBookings: async (status) => {
		try {
			set({ loading: true });
			const bookings = await bookingService.getProviderBookings(status);
			set({ bookings, loading: false });
		} catch (error) {
			console.error("Error fetching provider bookings:", error);
			showError("Failed to load provider bookings");
			set({ loading: false });
		}
	},

	createBooking: async (data) => {
		try {
			const newBooking = await bookingService.createBooking(data);
			set((state) => ({
				bookings: [...state.bookings, newBooking],
			}));
			return newBooking;
		} catch (error) {
			console.error("Error creating booking:", error);
			showError("Failed to create booking");
			throw error;
		}
	},

	updateBooking: async (bookingId, data) => {
		try {
			const updatedBooking = await bookingService.updateBooking(
				bookingId,
				data,
			);
			set((state) => ({
				bookings: state.bookings.map((booking) =>
					booking.id === bookingId ? updatedBooking : booking,
				),
			}));
		} catch (error) {
			console.error("Error updating booking:", error);
			showError("Failed to update booking");
			throw error;
		}
	},

	confirmBooking: async (bookingId) => {
		try {
			const updatedBooking = await bookingService.confirmBooking(bookingId);
			set((state) => ({
				bookings: state.bookings.map((booking) =>
					booking.id === bookingId
						? { ...booking, status: "confirmed" as BookingStatus }
						: booking,
				),
			}));
		} catch (error) {
			console.error("Error confirming booking:", error);
			showError("Failed to confirm booking");
			throw error;
		}
	},

	cancelBooking: async (bookingId, reason) => {
		try {
			const updatedBooking = await bookingService.cancelBooking(
				bookingId,
				reason,
			);
			set((state) => ({
				bookings: state.bookings.map((booking) =>
					booking.id === bookingId
						? { ...booking, status: "cancelled" as BookingStatus }
						: booking,
				),
			}));
		} catch (error) {
			console.error("Error cancelling booking:", error);
			showError("Failed to cancel booking");
			throw error;
		}
	},

	completeBooking: async (bookingId) => {
		try {
			const updatedBooking = await bookingService.completeBooking(bookingId);
			set((state) => ({
				bookings: state.bookings.map((booking) =>
					booking.id === bookingId
						? { ...booking, status: "completed" as BookingStatus }
						: booking,
				),
			}));
		} catch (error) {
			console.error("Error completing booking:", error);
			showError("Failed to complete booking");
			throw error;
		}
	},

	getBookingById: async (bookingId) => {
		try {
			return await bookingService.getBookingById(bookingId);
		} catch (error) {
			console.error("Error getting booking:", error);
			showError("Failed to load booking details");
			throw error;
		}
	},

	reset: () => {
		set(initialState);
	},
}));

export default useBookingsStore;
