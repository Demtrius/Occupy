import { useAuthStore } from "@store/auth.store";
import { User, LoginCredentials, RegisterData } from "../types";

interface UseAuthReturn {
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for accessing authentication state and actions
 *
 * @returns Object with auth state and actions
 *
 * @example
 * const { isLoggedIn, user, login, logout } = useAuth();
 *
 * // Check if user is logged in
 * if (isLoggedIn) {
 *   console.log('Welcome', user?.username);
 * }
 *
 * // Login
 * await login({ email: 'user@example.com', password: 'password' });
 *
 * // Logout
 * await logout();
 */
export function useAuth(): UseAuthReturn {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const register = useAuthStore((state) => state.register);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const clearError = useAuthStore((state) => state.clearError);

  return {
    isLoggedIn,
    isAuthenticated: isLoggedIn,
    user,
    isLoading,
    isInitializing,
    error,
    login,
    logout,
    register,
    updateProfile,
    clearError,
  };
}

export default useAuth;
