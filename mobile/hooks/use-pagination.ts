import { useState, useCallback } from "react";
import { ApiError } from "../types";

interface UsePaginationReturn<T> {
  data: T[];
  page: number;
  isLoading: boolean;
  hasMore: boolean;
  error: ApiError | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for handling paginated data loading
 *
 * @param fetchFunction - Function that fetches data for a given page
 * @param limit - Number of items per page (default: 20)
 * @returns Object with data, loading states, and pagination functions
 *
 * @example
 * const { data, isLoading, hasMore, loadMore, refresh } = usePagination(
 *   (page, limit) => postsService.getPosts(page, limit),
 *   20
 * );
 *
 * <FlatList
 *   data={data}
 *   onEndReached={loadMore}
 *   onEndReachedThreshold={0.5}
 *   refreshing={isLoading && page === 1}
 *   onRefresh={refresh}
 * />
 */
export function usePagination<T>(
  fetchFunction: (page: number, limit: number) => Promise<T[]>,
  limit: number = 20,
): UsePaginationReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetchFunction(page, limit);

      if (newData.length < limit) {
        setHasMore(false);
      }

      setData((prev) => [...prev, ...newData]);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, page, limit, isLoading, hasMore]);

  const refresh = useCallback(async () => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setIsLoading(true);

    try {
      const newData = await fetchFunction(1, limit);
      setData(newData);
      setPage(2);

      if (newData.length < limit) {
        setHasMore(false);
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, limit]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    page,
    isLoading,
    hasMore,
    error,
    loadMore,
    refresh,
    reset,
  };
}

export default usePagination;
