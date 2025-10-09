// Central export file for all stores

// Auth store
export { useAuthStore, default as authStore } from "./auth.store";

// App store
export {
  useAppStore,
  default as appStore,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from "./app.store";

// Posts store
export { usePostsStore, default as postsStore } from "./posts.store";

// Cliques store
export { useCliquesStore, default as cliquesStore } from "./cliques.store";

// Bookings store
export { useBookingsStore, default as bookingsStore } from "./bookings.store";

// Services store
export { useServicesStore, default as servicesStore } from "./services.store";

// Availability store
export { useAvailabilityStore, default as availabilityStore } from "./availability.store";

// Users store
export { useUsersStore, default as usersStore } from "./users.store";

// Re-export store types
export type { AppNotification } from "../types/store";
