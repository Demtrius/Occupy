import { create } from "zustand";
import { usersService } from "../services/users.service";
import { showError } from "./app.store";
import { User, Occupation } from "../types";

interface UsersState {
	// State
	userProfile: User | null;
	loading: boolean;
	refreshing: boolean;
	userStats: {
		followersCount: number;
		followingCount: number;
		postsCount: number;
		cliquesCount: number;
	} | null;

	// Actions
	fetchUserProfile: (userId: number) => Promise<void>;
	refreshUserProfile: () => Promise<void>;
	fetchUserStats: (userId: number) => Promise<void>;
	getAllUsers: (page?: number, limit?: number) => Promise<User[]>;
	getOccupations: () => Promise<Occupation[]>;
	searchUsers: (query: string) => Promise<User[]>;
	followUser: (userId: number) => Promise<void>;
	unfollowUser: (userId: number) => Promise<void>;
	clearUserProfile: () => void;
	reset: () => void;
}

const initialState = {
	userProfile: null,
	loading: false,
	refreshing: false,
	userStats: null,
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

	fetchUserStats: async (userId: number) => {
		try {
			const userStats = await usersService.getUserStats(userId);
			set({ userStats });
		} catch (error: any) {
			console.error("Error fetching user stats:", error);
			showError(error.message || "Failed to load user stats");
		}
	},

	getAllUsers: async (page: number = 1, limit: number = 20): Promise<User[]> => {
		try {
			const users = await usersService.getAllUsers(page, limit);
			return users;
		} catch (error: any) {
			console.error("Error fetching all users:", error);
			showError(error.message || "Failed to load users");
			return [];
		}
	},

	getOccupations: async (): Promise<Occupation[]> => {
		try {
			const occupations = await usersService.getOccupations();
			return occupations;
		} catch (error: any) {
			console.error("Error fetching occupations:", error);
			showError(error.message || "Failed to load occupations");
			return [];
		}
	},

	searchUsers: async (query: string): Promise<User[]> => {
		try {
			const users = await usersService.searchUsers(query);
			return users;
		} catch (error: any) {
			console.error("Error searching users:", error);
			showError(error.message || "Failed to search users");
			return [];
		}
	},

	followUser: async (userId: number) => {
		try {
			const result = await usersService.followUser(userId);

			// Update local state
			set((state) => ({
				userProfile: state.userProfile ? {
					...state.userProfile,
					isFollowing: result.isFollowing,
					followersCount: result.followersCount,
				} : null,
			}));
		} catch (error: any) {
			console.error("Error following user:", error);
			showError(error.message || "Failed to follow user");
			throw error;
		}
	},

	unfollowUser: async (userId: number) => {
		try {
			const result = await usersService.unfollowUser(userId);

			// Update local state
			set((state) => ({
				userProfile: state.userProfile ? {
					...state.userProfile,
					isFollowing: result.isFollowing,
					followersCount: result.followersCount,
				} : null,
			}));
		} catch (error: any) {
			console.error("Error unfollowing user:", error);
			showError(error.message || "Failed to unfollow user");
			throw error;
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
