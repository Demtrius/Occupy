import { showToast } from "@/stores/toast-store";

export function handleResponseError(error: any, config: any) {
	const errorData = error.response?.data as
		| { error?: { code?: string; message?: string } }
		| undefined;
	const code = errorData?.error?.code || "unknown_error";
	const message =
		errorData?.error?.message ||
		`Request failed with status ${error.response?.status || "unknown"}`;

	// Map error codes to user-friendly messages
	const friendlyMessage = getFriendlyErrorMessage(code, message);

	showToast({
		type: "error",
		title: "Error",
		message: friendlyMessage,
	});
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
