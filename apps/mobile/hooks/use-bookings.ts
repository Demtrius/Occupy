import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useCreateBookingMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/bookings", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["bookings"] });
		},
	});
}

export function useRescheduleBookingMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("patch", "/api/v1/bookings/{bookingId}/reschedule", {
		onSuccess: (data, variables) => {
			const bookingId = variables.params.path.bookingId;
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
	return $api.useQuery("get", "/api/v1/bookings/me", {
		params: {
			query: { status, cursor, limit },
		},
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
	return $api.useQuery("get", "/api/v1/bookings/cliques/{cliqueId}", {
		params: {
			path: { cliqueId: cliqueId! },
			query: { status, cursor, limit },
		},
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useConfirmBookingMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/bookings/{bookingId}/confirm", {
		onSuccess: (data, variables) => {
			const bookingId = variables.params.path.bookingId;
			queryClient.invalidateQueries({ queryKey: ["bookings", bookingId] });
		},
	});
}

export function useCancelBookingMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/bookings/{bookingId}/cancel", {
		onSuccess: (data, variables) => {
			const bookingId = variables.params.path.bookingId;
			queryClient.invalidateQueries({ queryKey: ["bookings", bookingId] });
		},
	});
}
