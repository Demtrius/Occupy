import { create } from "zustand";
import { servicesService } from "../services/services.service";
import { showError } from "./app.store";
import {
  Service,
  ServiceDetail,
  CreateServiceData,
} from "../types";

interface ServicesState {
  // State
  services: Service[];
  loading: boolean;
  refreshing: boolean;

  // Actions - Services
  fetchServices: (cliqueId?: number, isActive?: boolean) => Promise<void>;
  createService: (data: CreateServiceData) => Promise<Service>;
  updateService: (serviceId: number, data: Partial<CreateServiceData>) => Promise<void>;
  deleteService: (serviceId: number) => Promise<void>;
  getServiceById: (serviceId: number) => Promise<ServiceDetail>;

  // Utility actions
  reset: () => void;
}

const initialState = {
  services: [],
  loading: false,
  refreshing: false,
};

export const useServicesStore = create<ServicesState>((set, get) => ({
  ...initialState,

  // Services actions
  fetchServices: async (cliqueId, isActive) => {
    try {
      set({ loading: true });
      const services = await servicesService.getAllServices(cliqueId, isActive);
      set({ services, loading: false });
    } catch (error) {
      console.error("Error fetching services:", error);
      showError("Failed to load services");
      set({ loading: false });
    }
  },

  createService: async (data) => {
    try {
      const newService = await servicesService.createService(data);
      set((state) => ({
        services: [...state.services, newService],
      }));
      return newService;
    } catch (error) {
      console.error("Error creating service:", error);
      showError("Failed to create service");
      throw error;
    }
  },

  updateService: async (serviceId, data) => {
    try {
      const updatedService = await servicesService.updateService(serviceId, data);
      set((state) => ({
        services: state.services.map(service =>
          service.id === serviceId ? updatedService : service
        ),
      }));
    } catch (error) {
      console.error("Error updating service:", error);
      showError("Failed to update service");
      throw error;
    }
  },

  deleteService: async (serviceId) => {
    try {
      await servicesService.deleteService(serviceId);
      set((state) => ({
        services: state.services.filter(service => service.id !== serviceId),
      }));
    } catch (error) {
      console.error("Error deleting service:", error);
      showError("Failed to delete service");
      throw error;
    }
  },

  getServiceById: async (serviceId) => {
    try {
      return await servicesService.getServiceById(serviceId);
    } catch (error) {
      console.error("Error getting service:", error);
      showError("Failed to load service details");
      throw error;
    }
  },

  reset: () => {
    set(initialState);
  },
}));

export default useServicesStore;