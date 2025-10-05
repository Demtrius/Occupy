// API Response Types

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, string[]>;
}

export interface FormErrors {
  [key: string]: string;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = void> = () => Promise<T>;
