import { create } from "zustand";
import { usersService } from "../services/users.service";
import { showError } from "./app.store";
import { User } from "../types";

interface UsersState {
	// State
	userProfile: User | null;
	loading: boolean;
	refreshing: boolean;

	// Actions
	fetchUserProfile: (userId: number) => Promise<void>;
	refreshUserProfile: () => Promise<void>;
	clearUserProfile: () => void;
	reset: () => void;
}

const initialState = {
	userProfile: null,
	loading: false,
	refreshing: false,
};

export const useUsersStore = create<UsersState>((set, get) => ({
	...initialState,

	fetchUserProfile: async (userId: number) => {
		try {
			set({ loading: true });
			const userProfile = await usersService.getUserById(userId);
			set({ userProfile, loading: false });
		} catch (error: any) {
			console.error("Error fetching user profile:", error);
			showError(error.message || "Failed to load user profile");
			set({ loading: false });
		}
	},

	refreshUserProfile: async () => {
		const { userProfile } = get();
		if (!userProfile) return;

		try {
			set({ refreshing: true });
			const updatedProfile = await usersService.getUserById(userProfile.id);
			set({ userProfile: updatedProfile, refreshing: false });
		} catch (error: any) {
			console.error("Error refreshing user profile:", error);
			showError(error.message || "Failed to refresh user profile");
			set({ refreshing: false });
		}
	},

	clearUserProfile: () => {
		set({ userProfile: null });
	},

	reset: () => {
		set(initialState);
	},
}));

export default useUsersStore;
