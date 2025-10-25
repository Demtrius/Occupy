import { API_BASE_URL } from "@/config/env";
import { validateTokenResponse } from "@/schemas/auth";
import { useAuthStore } from "@/stores/auth-store";

export type ErrorEnvelope = {
	error: { code: string; message: string; details?: any };
};

export class ApiError extends Error {
	code?: string;
	status?: number;
	details?: any;

	constructor(message: string, code?: string, status?: number, details?: any) {
		super(message);
		this.code = code;
		this.status = status;
		this.details = details;
	}
}

let refreshing: Promise<string | null> | null = null;

async function refreshToken(
	oldRefresh: string | undefined,
): Promise<string | null> {
	if (!oldRefresh) return null;
	const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refreshToken: oldRefresh }),
	});
	if (res.ok) {
		const data = await res.json();
		const validated = validateTokenResponse(data);
		const { setAuth } = useAuthStore.getState();
		await setAuth({
			accessToken: validated.accessToken,
			refreshToken: validated.refreshToken,
		});
		return validated.accessToken;
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
		if (!refreshing) {
			refreshing = refreshToken(tokens.refreshToken).finally(() => {
				refreshing = null;
			});
		}
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
		throw new ApiError(
			err.error.message,
			err.error.code,
			res.status,
			err.error.details,
		);
	}
	return data as T;
}

export function qs(
	params: Record<string, string | number | boolean | null | undefined>,
): string {
	const search = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined && v !== null && v !== "") {
			search.append(k, String(v));
		}
	}
	return search.toString();
}
