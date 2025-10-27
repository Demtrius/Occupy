import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import { API_BASE_URL } from "@/config/env";
import { useAuthStore } from "@/stores/auth-store";
import type { paths } from "@/types/generated";
import { handleResponseError } from "./response-error-handler";

let refreshing: Promise<string | null> | null = null;

async function refreshToken(
	oldRefresh: string | undefined,
): Promise<string | null> {
	if (!oldRefresh) return null;

	const fetchClient = createFetchClient<paths>({ baseUrl: API_BASE_URL });
	const { data, error: _ } = await fetchClient.POST("/api/v1/auth/refresh", {
		body: { refreshToken: oldRefresh },
	});

	if (data) {
		const { setAuth } = useAuthStore.getState();
		await setAuth({
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
		});
		return data.accessToken;
	}
	return null;
}

// Create fetch client with middleware
const fetchClient = createFetchClient<paths>({
	baseUrl: API_BASE_URL,
});

// Auth middleware
fetchClient.use({
	async onRequest({ request }) {
		const { tokens } = useAuthStore.getState();
		if (tokens?.accessToken) {
			request.headers.set("Authorization", `Bearer ${tokens.accessToken}`);
		}
		return request;
	},
	async onResponse({ request, response }) {
		// Handle 401 - try to refresh token
		if (response.status === 401) {
			const { tokens } = useAuthStore.getState();
			if (tokens?.refreshToken) {
				if (!refreshing) {
					refreshing = refreshToken(tokens.refreshToken).finally(() => {
						refreshing = null;
					});
				}
				const newAccess = await refreshing;
				if (newAccess) {
					// Retry the request with new token
					request.headers.set("Authorization", `Bearer ${newAccess}`);
					return fetch(request);
				}
			}
		}
		return response;
	},
	async onError({ error }) {
		// Handle network/auth errors
		handleResponseError({ error }, {});
		// Return undefined to re-throw the error
		return undefined;
	},
});

// Error handling middleware
fetchClient.use({
	async onResponse({ response }) {
		if (!response.ok) {
			const errorData = await response
				.clone()
				.json()
				.catch(() => ({}));
			handleResponseError(
				{ response: { data: errorData, status: response.status } },
				{},
			);
		}
		return response;
	},
});

// Create the react-query client
export const $api = createClient(fetchClient);
