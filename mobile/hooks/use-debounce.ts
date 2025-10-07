import { useState, useEffect } from "react";

/**
 * Hook for debouncing values
 *
 * Delays updating the debounced value until after the specified delay
 * has passed without the value changing. Useful for search inputs,
 * API calls, etc.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns The debounced value
 *
 * @example
 * const [searchText, setSearchText] = useState('');
 * const debouncedSearch = useDebounce(searchText, 500);
 *
 * useEffect(() => {
 *   // This only runs 500ms after user stops typing
 *   if (debouncedSearch) {
 *     searchPosts(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 *
 * <TextInput
 *   value={searchText}
 *   onChangeText={setSearchText}
 * />
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function that cancels the timeout
    // if value changes (or component unmounts)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
