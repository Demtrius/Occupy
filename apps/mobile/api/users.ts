import { apiFetch } from "@/lib/api-client";
import { validateUser } from "@/schemas/user";
import type { Clique, Post } from "@/types/profile";
import type { User } from "@/types/user";

export async function getMe(): Promise<User> {
	const data = await apiFetch("/api/v1/users/me");
	return validateUser(data);
}

export async function getUser(userId: string): Promise<User> {
	const data = await apiFetch(`/api/v1/users/${userId}`);
	return validateUser(data);
}

export async function followUser(userId: string): Promise<{ status: string }> {
	const data = await apiFetch(`/api/v1/users/${userId}/follow`, {
		method: "POST",
	});
	return data;
}

export async function unfollowUser(
	userId: string,
): Promise<{ status: string }> {
	const data = await apiFetch(`/api/v1/users/${userId}/follow`, {
		method: "DELETE",
	});
	return data;
}

export async function blockUser(userId: string): Promise<{ status: string }> {
	const data = await apiFetch(`/api/v1/users/${userId}/follow/block`, {
		method: "POST",
	});
	return data;
}

export async function unblockUser(userId: string): Promise<{ status: string }> {
	const data = await apiFetch(`/api/v1/users/${userId}/follow/block`, {
		method: "DELETE",
	});
	return data;
}

export async function getUserPosts(
	userId: string,
	cursor?: string,
	limit = 20,
): Promise<{
	items: Post[];
	nextCursor?: string;
}> {
	const params = new URLSearchParams({ limit: limit.toString() });
	if (cursor) params.append("cursor", cursor);

	const data = await apiFetch(`/api/v1/posts/user/${userId}/posts?${params}`);
	return data;
}

export async function getUserCliques(
	userId: string,
	cursor?: string,
	limit = 20,
): Promise<{
	items: Clique[];
	nextCursor?: string;
}> {
	const params = new URLSearchParams({ limit: limit.toString() });
	if (cursor) params.append("cursor", cursor);

	const data = await apiFetch(
		`/api/v1/cliques/user/${userId}/cliques?${params}`,
	);
	return data;
}

export async function getUserBookings(
	cursor?: string,
	limit = 20,
): Promise<{
	items: any[];
	nextCursor?: string;
}> {
	const params = new URLSearchParams({ limit: limit.toString() });
	if (cursor) params.append("cursor", cursor);

	const data = await apiFetch(`/api/v1/bookings/me?${params}`);
	return data;
}

export async function getCliqueReviews(
	cliqueId: string,
	cursor?: string,
	limit = 20,
): Promise<{
	items: any[];
	nextCursor?: string;
}> {
	const params = new URLSearchParams({ limit: limit.toString() });
	if (cursor) params.append("cursor", cursor);

	const data = await apiFetch(`/api/v1/reviews/cliques/${cliqueId}?${params}`);
	return data;
}
