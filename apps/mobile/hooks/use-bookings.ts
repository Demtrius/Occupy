import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import type { RequestOptions } from "openapi-fetch";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { components, operations } from "@/types/generated";
import { withCursorHelpers } from "./utils";

type CreateBookingVariables = RequestOptions<operations["BookingsCreate"]>;
type RescheduleBookingVariables = RequestOptions<
	operations["BookingsReschedule"]
>;
type ConfirmBookingVariables = RequestOptions<operations["BookingsConfirm"]>;
type CancelBookingVariables = RequestOptions<operations["BookingsCancel"]>;

type Booking = components["schemas"]["Booking"];
type BookingsPage = components["schemas"]["CursorPageBookings"];

const bookingKeys = {
	all: ["bookings"] as const,
	detail: (bookingId: string) => ["bookings", "detail", bookingId] as const,
	mine: (status: string | undefined, limit: number) =>
		["bookings", "me", status ?? "all", { limit }] as const,
	clique: (cliqueId: string, status: string | undefined, limit: number) =>
		["bookings", "clique", cliqueId, status ?? "all", { limit }] as const,
};

export function useCreateBookingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: CreateBookingVariables) =>
			ensureData(await $api.POST("/api/v1/bookings", variables)),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: bookingKeys.all,
				exact: false,
			});
		},
	});
}

export function useRescheduleBookingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: RescheduleBookingVariables) =>
			ensureData(
				await $api.PATCH("/api/v1/bookings/{bookingId}/reschedule", variables),
			),
		onSuccess: (_data, variables) => {
			const bookingId = variables.params?.path?.bookingId;
			if (bookingId) {
				queryClient.invalidateQueries({
					queryKey: bookingKeys.detail(bookingId),
				});
			}
			queryClient.invalidateQueries({
				queryKey: bookingKeys.all,
				exact: false,
			});
		},
	});
}

export function useListMyBookingsQuery(
	enabled = true,
	status?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<BookingsPage>({
		queryKey: bookingKeys.mine(status, limit),
		enabled: Boolean(tokens?.accessToken) && enabled,
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/bookings/me", {
					params: {
						query: { status, cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
	return withCursorHelpers<Booking, BookingsPage>(query);
}

export function useListCliqueBookingsQuery(
	cliqueId: string | undefined,
	status?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<BookingsPage>({
		queryKey: bookingKeys.clique(cliqueId ?? "", status, limit),
		enabled: Boolean(tokens?.accessToken) && Boolean(cliqueId),
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			if (!cliqueId) {
				throw new Error("cliqueId is required");
			}
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/bookings/cliques/{cliqueId}", {
					params: {
						path: { cliqueId },
						query: { status, cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
	return withCursorHelpers<Booking, BookingsPage>(query);
}

export function useConfirmBookingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: ConfirmBookingVariables) =>
			ensureData(
				await $api.POST("/api/v1/bookings/{bookingId}/confirm", variables),
			),
		onSuccess: (_data, variables) => {
			const bookingId = variables.params?.path?.bookingId;
			if (bookingId) {
				queryClient.invalidateQueries({
					queryKey: bookingKeys.detail(bookingId),
				});
			}
			queryClient.invalidateQueries({
				queryKey: bookingKeys.all,
				exact: false,
			});
		},
	});
}

export function useCancelBookingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: CancelBookingVariables) =>
			ensureData(
				await $api.POST("/api/v1/bookings/{bookingId}/cancel", variables),
			),
		onSuccess: (_data, variables) => {
			const bookingId = variables.params?.path?.bookingId;
			if (bookingId) {
				queryClient.invalidateQueries({
					queryKey: bookingKeys.detail(bookingId),
				});
			}
			queryClient.invalidateQueries({
				queryKey: bookingKeys.all,
				exact: false,
			});
		},
	});
}
