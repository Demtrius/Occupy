import { useState, useCallback } from "react";
import { ApiError } from "../types";

interface UseAsyncReturn<T> {
  execute: () => Promise<T | undefined>;
  status: "idle" | "pending" | "success" | "error";
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  reset: () => void;
}

/**
 * Hook for handling async operations with loading and error states
 *
 * @param asyncFunction - The async function to execute
 * @returns Object with execute function, status, data, error, and helper booleans
 *
 * @example
 * const { execute, isLoading, data, error } = useAsync(
 *   () => postsService.getFeedPosts()
 * );
 *
 * // In your component
 * useEffect(() => {
 *   execute();
 * }, []);
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
): UseAsyncReturn<T> {
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async () => {
    setStatus("pending");
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus("success");
      return response;
    } catch (err) {
      setError(err as ApiError);
      setStatus("error");
      throw err;
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setStatus("idle");
    setData(null);
    setError(null);
  }, []);

  return {
    execute,
    status,
    data,
    error,
    isLoading: status === "pending",
    isSuccess: status === "success",
    isError: status === "error",
    isIdle: status === "idle",
    reset,
  };
}

export default useAsync;
