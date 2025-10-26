import { api } from "@/lib/api-client";
import { validateTokenRead } from "@/schemas/auth";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginRequest, UserCreate } from "@/types/auth";
import type { User } from "@/types/user";

export async function login(body: LoginRequest): Promise<User> {
	const response = await api.post("/api/v1/auth/login", body);
	const data = response.data;
	const { user, accessToken, refreshToken } = validateTokenRead(data);
	await useAuthStore.getState().setAuth({
		accessToken,
		refreshToken,
	});
	return user;
}

export async function register(body: UserCreate): Promise<User> {
	const response = await api.post("/api/v1/auth/register", body);
	const data = response.data;
	const { user, accessToken, refreshToken } = validateTokenRead(data);
	await useAuthStore.getState().setAuth({
		accessToken,
		refreshToken,
	});
	return user;
}

export async function refresh(): Promise<User> {
	const { tokens } = useAuthStore.getState();
	if (!tokens?.refreshToken) {
		throw new Error("No refresh token available");
	}
	const response = await api.post("/api/v1/auth/refresh", {
		refreshToken: tokens.refreshToken,
	});
	const data = response.data;
	const { user, accessToken, refreshToken } = validateTokenRead(data);
	await useAuthStore.getState().setAuth({
		accessToken,
		refreshToken,
	});
	return user;
}

export async function logout(): Promise<void> {
	const { tokens, clear } = useAuthStore.getState();
	if (tokens?.refreshToken) {
		await api.post("/api/v1/auth/logout", {
			refreshToken: tokens.refreshToken,
		});
	}
	clear();
}
