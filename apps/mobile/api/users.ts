import { api } from "@/lib/api-client";
import { validateUser } from "@/schemas/user";
import type { Booking, Clique, Post, Review } from "@/types/profile";
import type { User } from "@/types/user";

export async function getMe(): Promise<User> {
	const response = await api.get("/api/v1/users/me");
	return validateUser(response.data);
}

export async function getUser(userId: string): Promise<User> {
	const response = await api.get(`/api/v1/users/${userId}`);
	return validateUser(response.data);
}

export async function followUser(userId: string): Promise<{ status: string }> {
	const response = await api.post(`/api/v1/users/${userId}/follow`);
	return response.data as { status: string };
}

export async function unfollowUser(
	userId: string,
): Promise<{ status: string }> {
	const response = await api.delete(`/api/v1/users/${userId}/follow`);
	return response.data as { status: string };
}

export async function blockUser(userId: string): Promise<{ status: string }> {
	const response = await api.post(`/api/v1/users/${userId}/follow/block`);
	return response.data as { status: string };
}

export async function unblockUser(userId: string): Promise<{ status: string }> {
	const response = await api.delete(`/api/v1/users/${userId}/follow/block`);
	return response.data as { status: string };
}

export async function getUserPosts(
	userId: string,
	cursor?: string,
	limit = 20,
): Promise<{
	items: Post[];
	nextCursor?: string;
}> {
	const response = await api.get(`/api/v1/posts/user/${userId}/posts`, {
		params: { limit, cursor },
	});
	return response.data as { items: Post[]; nextCursor?: string };
}

export async function getUserCliques(
	userId: string,
	cursor?: string,
	limit = 20,
): Promise<{
	items: Clique[];
	nextCursor?: string;
}> {
	const response = await api.get(`/api/v1/cliques/user/${userId}/cliques`, {
		params: { limit, cursor },
	});
	return response.data as { items: Clique[]; nextCursor?: string };
}

export async function getUserBookings(
	cursor?: string,
	limit = 20,
): Promise<{
	items: Booking[];
	nextCursor?: string;
}> {
	const response = await api.get(`/api/v1/bookings/me`, {
		params: { limit, cursor },
	});
	return response.data as { items: Booking[]; nextCursor?: string };
}

export async function getCliqueReviews(
	cliqueId: string,
	cursor?: string,
	limit = 20,
): Promise<{
	items: Review[];
	nextCursor?: string;
}> {
	const response = await api.get(`/api/v1/reviews/cliques/${cliqueId}`, {
		params: { limit, cursor },
	});
	return response.data as { items: Review[]; nextCursor?: string };
}
