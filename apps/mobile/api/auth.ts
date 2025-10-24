import { validateTokenResponse } from "@/schemas/auth";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginBody, RegisterBody } from "@/types/auth";
import type { User } from "@/types/user";
import { apiFetch } from "./client";

export async function login(body: LoginBody): Promise<User> {
	const data = await apiFetch("/api/v1/auth/login", {
		method: "POST",
		body: JSON.stringify(body),
	});
	const { user, accessToken, refreshToken } = validateTokenResponse(data);
	await useAuthStore.getState().setAuth({
		user,
		tokens: {
			accessToken,
			refreshToken,
		},
	});
	return user;
}

export async function register(body: RegisterBody): Promise<User> {
	const data = await apiFetch("/api/v1/auth/register", {
		method: "POST",
		body: JSON.stringify(body),
	});
	const { user, accessToken, refreshToken } = validateTokenResponse(data);
	await useAuthStore.getState().setAuth({
		user,
		tokens: {
			accessToken,
			refreshToken,
		},
	});
	return user;
}

export async function logout(): Promise<void> {
	const { tokens, clear } = useAuthStore.getState();
	if (tokens?.refreshToken) {
		await apiFetch("/api/v1/auth/logout", {
			method: "POST",
			body: JSON.stringify({ refreshToken: tokens.refreshToken }),
		});
	}
	clear();
}
