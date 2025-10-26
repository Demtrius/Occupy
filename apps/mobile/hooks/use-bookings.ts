import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as bookings from "@/api/bookings";
import { useAuthStore } from "@/stores/auth-store";

export function useCreateBookingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: bookings.createBooking,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["bookings"] });
		},
	});
}

export function useRescheduleBookingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			bookingId,
			body,
		}: {
			bookingId: string;
			body: Parameters<typeof bookings.rescheduleBooking>[1];
		}) => bookings.rescheduleBooking(bookingId, body),
		onSuccess: (_, { bookingId }) => {
			queryClient.invalidateQueries({ queryKey: ["bookings", bookingId] });
		},
	});
}

export function useListMyBookingsQuery(
	enabled = true,
	status?: string,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["bookings", "me", { status, cursor, limit }],
		queryFn: () => bookings.listMyBookings(status, cursor, limit),
		enabled: !!tokens?.accessToken && enabled,
	});
}

export function useListCliqueBookingsQuery(
	cliqueId: string | undefined,
	status?: string,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["bookings", "cliques", cliqueId, { status, cursor, limit }],
		queryFn: () =>
			bookings.listCliqueBookings(cliqueId!, status, cursor, limit),
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useConfirmBookingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: bookings.confirmBooking,
		onSuccess: (_, bookingId) => {
			queryClient.invalidateQueries({ queryKey: ["bookings", bookingId] });
		},
	});
}

export function useCancelBookingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			bookingId,
			reason,
		}: {
			bookingId: string;
			reason?: string;
		}) => bookings.cancelBooking(bookingId, reason),
		onSuccess: (_, { bookingId }) => {
			queryClient.invalidateQueries({ queryKey: ["bookings", bookingId] });
		},
	});
}
