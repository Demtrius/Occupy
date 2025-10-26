export interface CursorPage<T> {
	items: T[];
	nextCursor?: string | null;
	meta?: Record<string, any> | null;
}
