export function getErrorMessage(
	error: unknown,
	defaultMessage = "Something went wrong",
): string {
	if (typeof error === "string") {
		return error;
	}
	if (error instanceof Error && error.message) {
		return error.message;
	}
	if (error && typeof error === "object" && "message" in error) {
		const message = (error as { message?: unknown }).message;
		if (typeof message === "string" && message.trim().length > 0) {
			return message;
		}
	}
	return defaultMessage;
}

export function getErrorCode(error: unknown): string | undefined {
	if (error && typeof error === "object" && "code" in error) {
		const code = (error as { code?: unknown }).code;
		if (typeof code === "string") {
			return code;
		}
		if (typeof code === "number") {
			return String(code);
		}
	}
	return undefined;
}
