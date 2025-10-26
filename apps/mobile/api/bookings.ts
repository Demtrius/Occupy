import { api } from "@/lib/api-client";
import type { CursorPage } from "@/types/base";
import type {
	Booking,
	BookingCreate,
	BookingReschedule,
} from "@/types/bookings";

export async function createBooking(body: BookingCreate): Promise<Booking> {
	const response = await api.post("/api/v1/bookings", body);
	return response.data as Booking;
}

export async function rescheduleBooking(
	bookingId: string,
	body: BookingReschedule,
): Promise<Booking> {
	const response = await api.patch(
		`/api/v1/bookings/${bookingId}/reschedule`,
		body,
	);
	return response.data as Booking;
}

export async function listMyBookings(
	status?: string,
	cursor?: string,
	limit = 20,
): Promise<CursorPage<Booking>> {
	const response = await api.get("/api/v1/bookings/me", {
		params: { status, limit, cursor },
	});
	return response.data as CursorPage<Booking>;
}

export async function listCliqueBookings(
	cliqueId: string,
	status?: string,
	cursor?: string,
	limit = 20,
): Promise<CursorPage<Booking>> {
	const response = await api.get(`/api/v1/bookings/cliques/${cliqueId}`, {
		params: { status, limit, cursor },
	});
	return response.data as CursorPage<Booking>;
}

export async function confirmBooking(bookingId: string): Promise<Booking> {
	const response = await api.post(`/api/v1/bookings/${bookingId}/confirm`);
	return response.data as Booking;
}

export async function cancelBooking(
	bookingId: string,
	reason?: string,
): Promise<Booking> {
	const response = await api.post(
		`/api/v1/bookings/${bookingId}/cancel`,
		reason ? { reason } : {},
	);
	return response.data as Booking;
}
