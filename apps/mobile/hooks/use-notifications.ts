import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useListNotificationsQuery(limit = 50, offset = 0) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/notifications", {
		params: {
			query: { limit, offset },
		},
		enabled: !!tokens?.accessToken,
	});
}

export function useMarkNotificationReadMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation(
		"put",
		"/api/v1/notifications/{notificationId}/read",
		{
			onSuccess: (data, variables) => {
				const notificationId = variables.params.path.notificationId;
				queryClient.invalidateQueries({
					queryKey: ["notifications", notificationId],
				});
			},
		},
	);
}

export function useMarkAllReadMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("put", "/api/v1/notifications/read-all", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
}
