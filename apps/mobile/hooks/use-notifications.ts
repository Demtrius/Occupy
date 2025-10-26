import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notifications from "@/api/notifications";
import { useAuthStore } from "@/stores/auth-store";

export function useListNotificationsQuery(limit = 50, offset = 0) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["notifications", { limit, offset }],
		queryFn: () => notifications.listNotifications(limit, offset),
		enabled: !!tokens?.accessToken,
	});
}

export function useMarkNotificationReadMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: notifications.markNotificationRead,
		onSuccess: (_, notificationId) => {
			queryClient.invalidateQueries({
				queryKey: ["notifications", notificationId],
			});
		},
	});
}

export function useMarkAllReadMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: notifications.markAllRead,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
}
