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

type ReviewsPage = components["schemas"]["CursorPageReviews"];
type CreateReviewVariables = RequestOptions<operations["ReviewsBookings"]>;

const reviewKeys = {
	all: ["reviews"] as const,
	clique: (cliqueId: string, limit: number) =>
		["reviews", "clique", cliqueId, { limit }] as const,
};

export function useCreateReviewMutation() {
	const queryClient = useQueryClient();
	return useMutation<Record<string, string>, unknown, CreateReviewVariables>({
		mutationFn: async (variables) =>
			ensureData(
				await $api.POST("/api/v1/reviews/bookings/{bookingId}", variables),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: reviewKeys.all, exact: false });
		},
	});
}

export function useListCliqueReviewsQuery(
	cliqueId: string | undefined,
	enabled = true,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<ReviewsPage>({
		queryKey: reviewKeys.clique(cliqueId ?? "", limit),
		enabled: Boolean(tokens?.accessToken) && Boolean(cliqueId) && enabled,
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			if (!cliqueId) {
				throw new Error("cliqueId is required");
			}
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/reviews/cliques/{cliqueId}", {
					params: {
						path: { cliqueId },
						query: { cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	return withCursorHelpers<components["schemas"]["Review"], ReviewsPage>(query);
}
