import { create } from "zustand";
import { cliquesService } from "../services/cliques.service";
import { showError } from "./app.store";
import { Clique } from "../types";

interface CliquesState {
  // State
  cliques: Clique[];
  filteredCliques: Clique[];
  loading: boolean;
  refreshing: boolean;
  search: string;

  // Actions
  setSearch: (search: string) => void;
  fetchCliques: () => Promise<void>;
  refreshCliques: () => Promise<void>;
  joinClique: (cliqueId: number) => Promise<void>;
  leaveClique: (cliqueId: number) => Promise<void>;
  createClique: (data: { name: string; description?: string; image?: string }) => Promise<Clique>;
  updateClique: (cliqueId: number, data: Partial<{ name: string; description?: string; image?: string }>) => Promise<void>;
  deleteClique: (cliqueId: number) => Promise<void>;
  reset: () => void;
}

const initialState = {
  cliques: [],
  filteredCliques: [],
  loading: false,
  refreshing: false,
  search: "",
};

export const useCliquesStore = create<CliquesState>((set, get) => ({
  ...initialState,

  setSearch: (search: string) => {
    set({ search });
    // Apply search filter
    const { cliques } = get();
    if (search.trim()) {
      const filtered = cliques.filter(clique => {
        const name = clique.name?.toLowerCase() || '';
        const description = clique.description?.toLowerCase() || '';
        const occupation = clique.occupation?.toLowerCase() || '';
        const searchTerm = search.toLowerCase();

        return (
          name.includes(searchTerm) ||
          description.includes(searchTerm) ||
          occupation.includes(searchTerm)
        );
      });
      set({ filteredCliques: filtered });
    } else {
      set({ filteredCliques: cliques });
    }
  },

   fetchCliques: async () => {
     try {
       set({ loading: true });
       const response = await cliquesService.getAllCliques();
       const cliques = response.results || [];
       set({
         cliques,
         filteredCliques: cliques,
         loading: false,
       });
     } catch (error) {
       console.error("Error fetching cliques:", error);
       showError("Failed to load cliques");
       set({ loading: false });
     }
   },

   refreshCliques: async () => {
     set({ refreshing: true });
     try {
       const response = await cliquesService.getAllCliques();
       const cliques = response.results || [];
       const { search } = get();

       // Apply current search filter
       let filteredCliques = cliques;
       if (search.trim()) {
         filteredCliques = cliques.filter(clique => {
           const name = clique.name?.toLowerCase() || '';
           const description = clique.description?.toLowerCase() || '';
           const occupation = clique.occupation?.toLowerCase() || '';
           const searchTerm = search.toLowerCase();

           return (
             name.includes(searchTerm) ||
             description.includes(searchTerm) ||
             occupation.includes(searchTerm)
           );
         });
       }

       set({
         cliques,
         filteredCliques,
         refreshing: false,
       });
     } catch (error) {
       console.error("Error refreshing cliques:", error);
       showError("Failed to refresh cliques");
       set({ refreshing: false });
     }
   },

  joinClique: async (cliqueId: number) => {
    try {
      await cliquesService.joinClique(cliqueId);

      // Update local state
      set((state) => ({
        cliques: state.cliques.map(clique =>
          clique.id === cliqueId
            ? { ...clique, isMember: true, membersCount: (clique.membersCount || 0) + 1 }
            : clique
        ),
        filteredCliques: state.filteredCliques.map(clique =>
          clique.id === cliqueId
            ? { ...clique, isMember: true, membersCount: (clique.membersCount || 0) + 1 }
            : clique
        ),
      }));
    } catch (error) {
      console.error("Error joining clique:", error);
      showError("Failed to join clique");
      throw error;
    }
  },

  leaveClique: async (cliqueId: number) => {
    try {
      await cliquesService.leaveClique(cliqueId);

      // Update local state
      set((state) => ({
        cliques: state.cliques.map(clique =>
          clique.id === cliqueId
            ? { ...clique, isMember: false, membersCount: Math.max((clique.membersCount || 0) - 1, 0) }
            : clique
        ),
        filteredCliques: state.filteredCliques.map(clique =>
          clique.id === cliqueId
            ? { ...clique, isMember: false, membersCount: Math.max((clique.membersCount || 0) - 1, 0) }
            : clique
        ),
      }));
    } catch (error) {
      console.error("Error leaving clique:", error);
      showError("Failed to leave clique");
      throw error;
    }
  },

  createClique: async (data) => {
    try {
      const newClique = await cliquesService.createClique(data);

      // Add to local state
      set((state) => ({
        cliques: [newClique, ...state.cliques],
        filteredCliques: [newClique, ...state.filteredCliques],
      }));

      return newClique;
    } catch (error) {
      console.error("Error creating clique:", error);
      showError("Failed to create clique");
      throw error;
    }
  },

  updateClique: async (cliqueId: number, data) => {
    try {
      const updatedClique = await cliquesService.updateClique(cliqueId, data);

      // Update local state
      set((state) => ({
        cliques: state.cliques.map(clique =>
          clique.id === cliqueId ? updatedClique : clique
        ),
        filteredCliques: state.filteredCliques.map(clique =>
          clique.id === cliqueId ? updatedClique : clique
        ),
      }));
    } catch (error) {
      console.error("Error updating clique:", error);
      showError("Failed to update clique");
      throw error;
    }
  },

  deleteClique: async (cliqueId: number) => {
    try {
      await cliquesService.deleteClique(cliqueId);

      // Remove from local state
      set((state) => ({
        cliques: state.cliques.filter(clique => clique.id !== cliqueId),
        filteredCliques: state.filteredCliques.filter(clique => clique.id !== cliqueId),
      }));
    } catch (error) {
      console.error("Error deleting clique:", error);
      showError("Failed to delete clique");
      throw error;
    }
  },

  reset: () => {
    set(initialState);
  },
}));

export default useCliquesStore;