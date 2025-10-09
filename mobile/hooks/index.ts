// Central export file for all custom hooks

// Auth hook
export { useAuth, default as useAuthDefault } from "./use-auth";

// Async operations hook
export { useAsync, default as useAsyncDefault } from "./use-async";

// Form management hook
export { useForm, default as useFormDefault } from "./use-form";

// Debounce hook
export { useDebounce, default as useDebounceDefault } from "./use-debounce";

// Pagination hook
export {
  usePagination,
  default as usePaginationDefault,
} from "./use-pagination";

// Toggle hook
export { useToggle, default as useToggleDefault } from "./use-toggle";

// Post form hook
export { usePostForm, default as usePostFormDefault } from "./use-post-form";

// Clique form hook
export { useCliqueForm, default as useCliqueFormDefault } from "./use-clique-form";

// Re-export types
export type { ApiError } from "../types";
