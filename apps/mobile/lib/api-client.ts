import { API_BASE_URL } from "@/config/env";
import { validateTokenResponse } from "@/schemas/auth";
import { useAuthStore } from "@/stores/auth-store";

export type ErrorEnvelope = {
	error: { code: string; message: string; details?: unknown };
};

export interface ApiRequestConfig {
	url?: string;
	method?: string;
	baseURL?: string;
	headers?: Record<string, string>;
	params?: Record<string, unknown>;
	data?: unknown;
	timeout?: number;
}

export interface ApiResponse<T = unknown> {
	data: T;
	status: number;
	statusText: string;
	headers: Record<string, string>;
	config: ApiRequestConfig;
}

export class ApiError extends Error {
	code?: string;
	status?: number;
	details?: unknown;
	config?: ApiRequestConfig;
	response?: ApiResponse;

	constructor(
		message: string,
		code?: string,
		status?: number,
		details?: unknown,
		config?: ApiRequestConfig,
		response?: ApiResponse,
	) {
		super(message);
		this.code = code;
		this.status = status;
		this.details = details;
		this.config = config;
		this.response = response;
	}
}

type RequestInterceptor = (
	config: ApiRequestConfig,
) => ApiRequestConfig | Promise<ApiRequestConfig>;

type ResponseInterceptor = (
	response: ApiResponse<unknown>,
) => ApiResponse<unknown> | Promise<ApiResponse<unknown>>;

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

export class ApiClient {
	defaults: ApiRequestConfig;
	interceptors: {
		request: RequestInterceptor[];
		response: ResponseInterceptor[];
	};

	constructor(config: ApiRequestConfig = {}) {
		this.defaults = {
			baseURL: API_BASE_URL.replace(/\/$/, ""),
			headers: { "Content-Type": "application/json" },
			...config,
		};
		this.interceptors = {
			request: [],
			response: [],
		};
	}

	async request<T = unknown>(
		config: ApiRequestConfig,
	): Promise<ApiResponse<T>> {
		let mergedConfig = { ...this.defaults, ...config };

		// Apply request interceptors
		for (const interceptor of this.interceptors.request) {
			mergedConfig = await interceptor(mergedConfig);
		}

		// Build URL
		let url = mergedConfig.url || "";
		if (!url.startsWith("http")) {
			url = `${mergedConfig.baseURL}${url}`;
		}
		if (mergedConfig.params) {
			const query = qs(mergedConfig.params);
			if (query) url += `?${query}`;
		}

		// Headers
		const headers = { ...mergedConfig.headers };

		// Add auth
		const { tokens } = useAuthStore.getState();
		if (tokens?.accessToken) {
			headers.Authorization = `Bearer ${tokens.accessToken}`;
		}

		// Body
		let body: string | undefined;
		if (mergedConfig.data) {
			body = JSON.stringify(mergedConfig.data);
		}

		// Fetch
		let res = await fetch(url, {
			method: mergedConfig.method || "GET",
			headers,
			body,
		});

		// Handle 401
		if (res.status === 401 && tokens?.refreshToken) {
			if (!refreshing) {
				refreshing = refreshToken(tokens.refreshToken).finally(() => {
					refreshing = null;
				});
			}
			const newAccess = await refreshing;
			if (newAccess) {
				headers.Authorization = `Bearer ${newAccess}`;
				res = await fetch(url, {
					method: mergedConfig.method || "GET",
					headers,
					body,
				});
			}
		}

		// Parse response
		const contentType = res.headers.get("content-type") || "";
		let data: unknown;
		if (contentType.includes("application/json")) {
			data = await res.json();
		} else {
			data = await res.text();
		}

		let response: ApiResponse<T> = {
			data: data as T,
			status: res.status,
			statusText: res.statusText,
			headers: Object.fromEntries(res.headers.entries()),
			config: mergedConfig,
		};

		// Apply response interceptors
		for (const interceptor of this.interceptors.response) {
			response = (await interceptor(
				response as ApiResponse<unknown>,
			)) as ApiResponse<T>;
		}

		if (!res.ok) {
			const err = (data as ErrorEnvelope) ?? {
				error: { code: "http_error", message: `${res.status}` },
			};
			throw new ApiError(
				err.error.message,
				err.error.code,
				res.status,
				err.error.details,
				mergedConfig,
				response,
			);
		}

		return response;
	}

	get<T = unknown>(
		url: string,
		config: Omit<ApiRequestConfig, "url" | "method"> = {},
	): Promise<ApiResponse<T>> {
		return this.request<T>({ ...config, url, method: "GET" });
	}

	post<T = unknown>(
		url: string,
		data?: unknown,
		config: Omit<ApiRequestConfig, "url" | "method" | "data"> = {},
	): Promise<ApiResponse<T>> {
		return this.request<T>({ ...config, url, method: "POST", data });
	}

	put<T = unknown>(
		url: string,
		data?: unknown,
		config: Omit<ApiRequestConfig, "url" | "method" | "data"> = {},
	): Promise<ApiResponse<T>> {
		return this.request<T>({ ...config, url, method: "PUT", data });
	}

	delete<T = unknown>(
		url: string,
		config: Omit<ApiRequestConfig, "url" | "method"> = {},
	): Promise<ApiResponse<T>> {
		return this.request<T>({ ...config, url, method: "DELETE" });
	}

	patch<T = unknown>(
		url: string,
		data?: unknown,
		config: Omit<ApiRequestConfig, "url" | "method" | "data"> = {},
	): Promise<ApiResponse<T>> {
		return this.request<T>({ ...config, url, method: "PATCH", data });
	}
}

export const api = new ApiClient();

export function qs(params: Record<string, unknown>): string {
	const search = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined && v !== null && v !== "") {
			search.append(k, String(v));
		}
	}
	return search.toString();
}
