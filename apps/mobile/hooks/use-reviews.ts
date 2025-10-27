import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useCreateReviewMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/reviews/bookings/{bookingId}", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reviews"] });
		},
	});
}

export function useListCliqueReviewsQuery(
	cliqueId: string | undefined,
	enabled = true,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/reviews/cliques/{cliqueId}", {
		params: {
			path: { cliqueId: cliqueId! },
			query: { cursor, limit },
		},
		enabled: !!tokens?.accessToken && !!cliqueId && enabled,
	});
}
