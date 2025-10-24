import { API_BASE_URL } from "@/config/env";
import { useAuthStore } from "@/state/auth.store";

type ErrorEnvelope = {
	error: { code: string; message: string; details?: any };
};

let refreshing: Promise<string | null> | null = null;

async function refreshToken(
	oldRefresh: string | undefined,
): Promise<string | null> {
	if (!oldRefresh) return null;
	const r = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refresh_token: oldRefresh }),
	});
	if (r.ok) {
		const data = await r.json();
		const { setAuth, user, tokens: _ } = useAuthStore.getState();
		await setAuth({
			user,
			tokens: {
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
			},
		});
		return data.accessToken as string;
	}
	return null;
}

export async function apiFetch<T = any>(
	path: string,
	init: RequestInit = {},
): Promise<T> {
	const base = API_BASE_URL.replace(/\/$/, "");
	const url = path.startsWith("http") ? path : `${base}${path}`;
	const { tokens } = useAuthStore.getState();
	const headers = {
		"Content-Type": "application/json",
		...(init.headers || {}),
	} as any;
	if (tokens?.accessToken)
		headers.Authorization = `Bearer ${tokens.accessToken}`;

	let res = await fetch(url, { ...init, headers });

	if (res.status === 401 && tokens?.refreshToken) {
		if (!refreshing)
			refreshing = refreshToken(tokens.refreshToken).finally(() => {
				refreshing = null;
			});
		const newAccess = await refreshing;
		if (newAccess) {
			headers.Authorization = `Bearer ${newAccess}`;
			res = await fetch(url, { ...init, headers });
		}
	}

	const ct = res.headers.get("content-type") || "";
	const data = ct.includes("application/json") ? await res.json() : undefined;

	if (!res.ok) {
		const err = (data as ErrorEnvelope) ?? {
			error: { code: "http_error", message: `${res.status}` },
		};
		throw Object.assign(new Error(err.error.message), {
			code: err.error.code,
			status: res.status,
			details: err.error.details,
		});
	}
	return data as T;
}
