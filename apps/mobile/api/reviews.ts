import { api } from "@/lib/api-client";
import type { CursorPage } from "@/types/base";
import type { Review, ReviewCreate } from "@/types/reviews";

export async function createReview(
	bookingId: string,
	body: ReviewCreate,
): Promise<{ id: string }> {
	const response = await api.post(
		`/api/v1/reviews/bookings/${bookingId}`,
		body,
	);
	return response.data as { id: string };
}

export async function listCliqueReviews(
	cliqueId: string,
	cursor?: string,
	limit = 20,
): Promise<CursorPage<Review>> {
	const response = await api.get(`/api/v1/reviews/cliques/${cliqueId}`, {
		params: { limit, cursor },
	});
	return response.data as CursorPage<Review>;
}
