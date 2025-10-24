import { apiFetch } from "../lib/api-client";

export type TokenRead = {
	accessToken: string;
	refreshToken: string;
	user: { id: string; username: string };
};

export async function register(payload: {
	email: string;
	username: string;
	password: string;
	fullName?: string;
}) {
	return apiFetch<TokenRead>("/api/v1/auth/register", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}
export async function login(payload: {
	emailOrUsername: string;
	password: string;
}) {
	return apiFetch<TokenRead>("/api/v1/auth/login", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}
export async function me() {
	return apiFetch<{ id: string; username: string }>("/api/v1/users/me");
}
