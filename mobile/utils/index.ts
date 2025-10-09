// Central export file for all utilities

// Storage utility (platform-aware)
export { storage, default as storageDefault } from "./storage";

// Date utilities
export {
  getFormattedDate,
  formatDateForAPI,
  formatTimeForAPI,
  formatTimeDisplay,
  parseTimeToMinutes,
  addMinutesToTime,
  calculateDuration,
} from "./date";
