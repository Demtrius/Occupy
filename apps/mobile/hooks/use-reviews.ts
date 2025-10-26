import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as reviews from "@/api/reviews";
import { useAuthStore } from "@/stores/auth-store";

export function useCreateReviewMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			bookingId,
			body,
		}: {
			bookingId: string;
			body: Parameters<typeof reviews.createReview>[1];
		}) => reviews.createReview(bookingId, body),
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
	return useQuery({
		queryKey: ["reviews", "cliques", cliqueId, { cursor, limit }],
		queryFn: () => reviews.listCliqueReviews(cliqueId!, cursor, limit),
		enabled: !!tokens?.accessToken && !!cliqueId && enabled,
	});
}
