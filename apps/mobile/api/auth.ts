import { api } from "@/lib/api-client";
import { validateTokenResponse } from "@/schemas/auth";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginBody, RegisterBody } from "@/types/auth";
import type { User } from "@/types/user";

export async function login(body: LoginBody): Promise<User> {
	const response = await api.post("/api/v1/auth/login", body);
	const data = response.data;
	const { user, accessToken, refreshToken } = validateTokenResponse(data);
	await useAuthStore.getState().setAuth({
		accessToken,
		refreshToken,
	});
	return user;
}

export async function register(body: RegisterBody): Promise<User> {
	const response = await api.post("/api/v1/auth/register", body);
	const data = response.data;
	const { user, accessToken, refreshToken } = validateTokenResponse(data);
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
