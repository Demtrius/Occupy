import { create } from "zustand";
import { availabilityService } from "../services/availability.service";
import { showError } from "./app.store";
import {
  Availability,
  CreateAvailabilityData,
  TimeSlot,
} from "../types";

interface AvailabilityState {
  // State
  availability: Availability[];
  loading: boolean;
  refreshing: boolean;

  // Actions - Availability
  fetchAvailability: (cliqueId?: number, startDate?: string, endDate?: string) => Promise<void>;
  createAvailability: (data: CreateAvailabilityData) => Promise<Availability>;
  updateAvailability: (availabilityId: number, data: Partial<CreateAvailabilityData>) => Promise<void>;
  deleteAvailability: (availabilityId: number) => Promise<void>;
  getAvailableTimeSlots: (serviceId: number, date: string) => Promise<TimeSlot[]>;

  // Utility actions
  reset: () => void;
}

const initialState = {
  availability: [],
  loading: false,
  refreshing: false,
};

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  ...initialState,

  // Availability actions
  fetchAvailability: async (cliqueId, startDate, endDate) => {
    try {
      set({ loading: true });
      const availability = await availabilityService.getAvailability(cliqueId, startDate, endDate);
      set({ availability, loading: false });
    } catch (error) {
      console.error("Error fetching availability:", error);
      showError("Failed to load availability");
      set({ loading: false });
    }
  },

  createAvailability: async (data) => {
    try {
      const newAvailability = await availabilityService.createAvailability(data);
      set((state) => ({
        availability: [...state.availability, newAvailability],
      }));
      return newAvailability;
    } catch (error) {
      console.error("Error creating availability:", error);
      showError("Failed to create availability");
      throw error;
    }
  },

  updateAvailability: async (availabilityId, data) => {
    try {
      const updatedAvailability = await availabilityService.updateAvailability(availabilityId, data);
      set((state) => ({
        availability: state.availability.map(avail =>
          avail.id === availabilityId ? updatedAvailability : avail
        ),
      }));
    } catch (error) {
      console.error("Error updating availability:", error);
      showError("Failed to update availability");
      throw error;
    }
  },

  deleteAvailability: async (availabilityId) => {
    try {
      await availabilityService.deleteAvailability(availabilityId);
      set((state) => ({
        availability: state.availability.filter(avail => avail.id !== availabilityId),
      }));
    } catch (error) {
      console.error("Error deleting availability:", error);
      showError("Failed to delete availability");
      throw error;
    }
  },

  getAvailableTimeSlots: async (serviceId, date) => {
    try {
      return await availabilityService.getAvailableTimeSlots(serviceId, date);
    } catch (error) {
      console.error("Error getting time slots:", error);
      showError("Failed to load available time slots");
      throw error;
    }
  },

  reset: () => {
    set(initialState);
  },
}));

export default useAvailabilityStore;