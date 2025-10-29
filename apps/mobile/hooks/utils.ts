import type {
	InfiniteData,
	UseInfiniteQueryResult,
} from "@tanstack/react-query";

export type CursorPageShape<TItem> = {
	items?: readonly TItem[];
	nextCursor?: string | null;
};

export type ItemsWithCursor<TItem> = {
	items: TItem[];
	nextCursor: string | null;
};

export function withCursorHelpers<TItem, TPage extends CursorPageShape<TItem>>(
	query: UseInfiniteQueryResult<InfiniteData<TPage>, unknown>,
): UseInfiniteQueryResult<InfiniteData<TPage>, unknown> &
	ItemsWithCursor<TItem> {
	const pages =
		(query.data?.pages as Array<CursorPageShape<TItem>> | undefined) ?? [];
	const items = pages.flatMap((page) => [...(page.items ?? [])]);
	const nextCursor =
		pages.length > 0 ? (pages[pages.length - 1]?.nextCursor ?? null) : null;

	return {
		...query,
		items,
		nextCursor,
	};
}
