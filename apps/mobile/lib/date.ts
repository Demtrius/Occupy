export type HourDisplayFormat = "short" | "long";

interface FormatRelativeTimestampOptions {
	includeJustNow?: boolean;
	hourDisplay?: HourDisplayFormat;
}

export function formatRelativeTimestamp(
	isoDate: string,
	{
		includeJustNow = false,
		hourDisplay = "long",
	}: FormatRelativeTimestampOptions = {},
): string {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const now = new Date();
	const diffMs = now.getTime() - date.getTime();

	if (diffMs < 0) {
		return date.toLocaleDateString();
	}

	const diffMinutes = Math.floor(diffMs / 60000);

	if (diffMinutes < 1) {
		if (includeJustNow) {
			return "Just now";
		}

		return "1 minute ago";
	}

	if (diffMinutes < 60) {
		const minutes = Math.max(diffMinutes, 1);
		return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
	}

	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) {
		if (hourDisplay === "short") {
			return `${diffHours}h ago`;
		}

		return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
	}

	return date.toLocaleDateString();
}
