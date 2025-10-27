export type CursorPage<T> = {
	nextCursor?: string | null;
	meta?: { [key: string]: unknown } | null;
	items: readonly T[];
};
