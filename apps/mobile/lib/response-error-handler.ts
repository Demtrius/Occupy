import { getErrorMessage } from "@/lib/error-utils";
import { useAuthStore } from "@/stores/auth-store";
import { showToast } from "@/stores/toast-store";

type ErrorResponsePayload = {
	response?: {
		data?: { error?: { code?: string; message?: string } };
		status?: number;
	};
	error?: unknown;
};

export function handleResponseError(
	payload: ErrorResponsePayload,
	_config?: unknown,
) {
	const { response } = payload;
	const code = response?.data?.error?.code ?? "unknown_error";
	const fallbackMessage =
		response?.data?.error?.message ??
		(response?.status
			? `Request failed with status ${response.status}`
			: getErrorMessage(payload.error, "Request failed"));

	const friendlyMessage = getFriendlyErrorMessage(code, fallbackMessage);

	showToast({
		type: "error",
		title: "Error",
		message: friendlyMessage,
	});

	// Auto-logout on authentication failures
	if (
		code === "invalid_refresh_token" ||
		(code === "http_error" &&
			response?.data?.error?.message?.includes("Invalid refresh token"))
	) {
		const { clear } = useAuthStore.getState();
		clear(); // Clear invalid tokens
		// Import router dynamically to avoid circular dependency
		import("expo-router").then(({ router }) => {
			router.replace("/(auth)/login");
		});
	}
}

function getFriendlyErrorMessage(code: string, defaultMessage: string): string {
	switch (code) {
		case "invalid_credentials":
			return "Invalid email or password. Please check your credentials and try again.";
		case "user_not_found":
			return "No account found with this email. Please sign up or check your email.";
		case "email_already_exists":
			return "An account with this email already exists. Please log in instead.";
		case "token_expired":
			return "Your session has expired. Please log in again.";
		case "invalid_refresh_token":
		case "http_error": // Backend sends this for invalid refresh token
			return "Your session has expired. Please log in again.";
		case "insufficient_permissions":
			return "You don't have permission to perform this action.";
		case "validation_error":
			return "Please check your input and try again.";
		case "network_error":
			return "Network error. Please check your connection and try again.";
		default:
			return defaultMessage;
	}
}
