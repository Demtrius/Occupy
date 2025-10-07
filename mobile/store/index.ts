// Central export file for all stores

// Auth store./app.store
export { useAuthStore, default as authStore } from "./auth.store";

// App store./app.store
export {
  useAppStore,
  default as appStore,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from "./app.store";

// Re-export store types
export type { AppNotification } from "../types/store";
