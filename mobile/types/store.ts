// Store Types (for Zustand)

import { User } from "./user";
import { AuthTokens, LoginCredentials, RegisterData } from "./auth";

export interface AuthState {
	isLoggedIn: boolean;
	user: User | null;
	tokens: AuthTokens | null;
	isLoading: boolean;
	isInitializing: boolean;
	error: string | null;
	login: (credentials: LoginCredentials) => Promise<void>;
	register: (data: RegisterData) => Promise<void>;
	logout: () => Promise<void>;
	refreshToken: () => Promise<void>;
	setUser: (user: User | null) => void;
	setTokens: (tokens: AuthTokens | null) => void;
	setError: (error: string | null) => void;
	clearError: () => void;
	initialize: () => Promise<void>;
	updateProfile: (data: Partial<User>) => Promise<void>;
	checkAuth: () => Promise<boolean>;
}

export interface AppNotification {
	id: string;
	type: "success" | "error" | "warning" | "info";
	message: string;
	duration?: number;
}

export interface AppState {
	domain: string;
	isLoading: boolean;
	isOnline: boolean;
	error: string | null;
	notifications: AppNotification[];
	theme: "light" | "dark" | "auto";
	language: string;
	setLoading: (loading: boolean) => void;
	startLoading: () => void;
	stopLoading: () => void;
	setError: (error: string | null) => void;
	clearError: () => void;
	setOnlineStatus: (status: boolean) => void;
	addNotification: (notification: Omit<AppNotification, "id">) => void;
	removeNotification: (id: string) => void;
	clearNotifications: () => void;
	setTheme: (theme: "light" | "dark" | "auto") => void;
	setLanguage: (language: string) => void;
	reset: () => void;
}
