import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RequestOptions } from "openapi-fetch";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { components, operations } from "@/types/generated";

type Notification = components["schemas"]["Notification"];
type MarkReadVariables = RequestOptions<operations["NotificationsRead"]>;
type MarkAllReadVariables = RequestOptions<operations["NotificationsReadAll"]>;

const notificationKeys = {
	all: ["notifications"] as const,
	list: (limit: number, offset: number) =>
		["notifications", { limit, offset }] as const,
};

export function useListNotificationsQuery(limit = 50, offset = 0) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: notificationKeys.list(limit, offset),
		enabled: Boolean(tokens?.accessToken),
		queryFn: async () =>
			ensureData(
				await $api.GET("/api/v1/notifications", {
					params: {
						query: { limit, offset },
					},
				}),
			),
	});
}

export function useMarkNotificationReadMutation() {
	const queryClient = useQueryClient();
	return useMutation<Notification, unknown, MarkReadVariables>({
		mutationFn: async (variables) =>
			ensureData(
				await $api.PUT("/api/v1/notifications/{notificationId}/read", variables),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: notificationKeys.all, exact: false });
		},
	});
}

export function useMarkAllReadMutation() {
	const queryClient = useQueryClient();
	return useMutation<Record<string, string>, unknown, MarkAllReadVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.PUT("/api/v1/notifications/read-all", variables)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: notificationKeys.all, exact: false });
		},
	});
}
