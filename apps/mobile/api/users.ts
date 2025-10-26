import { api } from "@/lib/api-client";
import { validateUser } from "@/schemas/user";
import type { CursorPage } from "@/types/base";
import type { User, UserSearchParams, UserUpdate } from "@/types/user";
import type { Follow } from "@/types/users";

export async function getMe(): Promise<User> {
	const response = await api.get("/api/v1/users/me");
	return validateUser(response.data);
}

export async function getUser(userId: string): Promise<User> {
	const response = await api.get(`/api/v1/users/${userId}`);
	return validateUser(response.data);
}

export async function followUser(userId: string): Promise<Follow> {
	const response = await api.post(`/api/v1/users/${userId}/follow`);
	return response.data as Follow;
}

export async function unfollowUser(
	userId: string,
): Promise<{ status: string }> {
	const response = await api.delete(`/api/v1/users/${userId}/follow`);
	return response.data as { status: string };
}

export async function blockUser(userId: string): Promise<Follow> {
	const response = await api.post(`/api/v1/users/${userId}/follow/block`);
	return response.data as Follow;
}

export async function unblockUser(userId: string): Promise<{ status: string }> {
	const response = await api.delete(`/api/v1/users/${userId}/follow/block`);
	return response.data as { status: string };
}

export async function updateMe(body: UserUpdate): Promise<User> {
	const response = await api.patch("/api/v1/users/me", body);
	return validateUser(response.data);
}

export async function searchUsers(
	params: UserSearchParams,
): Promise<CursorPage<User>> {
	const response = await api.get("/api/v1/users", { params });
	return response.data as CursorPage<User>;
}

export async function approveFollow(userId: string): Promise<Follow> {
	const response = await api.post(`/api/v1/users/${userId}/follow/approve`);
	return response.data as Follow;
}

export async function rejectFollow(
	userId: string,
): Promise<{ status: string }> {
	const response = await api.post(`/api/v1/users/${userId}/follow/reject`);
	return response.data as { status: string };
}

export async function removeFollower(
	userId: string,
	followerId: string,
): Promise<{ status: string }> {
	const response = await api.delete(
		`/api/v1/users/${userId}/follow/followers/${followerId}`,
	);
	return response.data as { status: string };
}

export async function listFollowers(
	userId: string,
	cursor?: string,
	limit = 20,
): Promise<CursorPage<Follow>> {
	const response = await api.get(`/api/v1/users/${userId}/follow/followers`, {
		params: { limit, cursor },
	});
	return response.data as CursorPage<Follow>;
}

export async function listFollowing(
	userId: string,
	cursor?: string,
	limit = 20,
): Promise<CursorPage<Follow>> {
	const response = await api.get(`/api/v1/users/${userId}/follow/following`, {
		params: { limit, cursor },
	});
	return response.data as CursorPage<Follow>;
}
