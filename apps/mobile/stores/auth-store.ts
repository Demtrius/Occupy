// /stores/auth-store.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";
import type { User } from "@/types/user";

type Tokens = { accessToken: string; refreshToken: string } | null;

type AuthState = {
	user: User | null;
	tokens: Tokens;
	hydrate: () => Promise<void>;
	setAuth: (p: { user: User | null; tokens: Tokens }) => Promise<void>;
	clear: () => Promise<void>;
};

const TOKENS_KEY = "auth.tokens";
const USER_KEY = "auth.user";

async function saveTokens(tokens: Tokens) {
	const json = tokens ? JSON.stringify(tokens) : "";
	if (Platform.OS === "web") {
		if (tokens) await AsyncStorage.setItem(TOKENS_KEY, json);
		else await AsyncStorage.removeItem(TOKENS_KEY);
	} else {
		try {
			if (tokens) await setItemAsync(TOKENS_KEY, json);
			else await deleteItemAsync(TOKENS_KEY);
		} catch {
			if (tokens) await AsyncStorage.setItem(TOKENS_KEY, json);
			else await AsyncStorage.removeItem(TOKENS_KEY);
		}
	}
}

async function loadTokens(): Promise<Tokens> {
	if (Platform.OS === "web") {
		const v = await AsyncStorage.getItem(TOKENS_KEY);
		if (v) return JSON.parse(v);
	} else {
		try {
			const v = await getItemAsync(TOKENS_KEY);
			if (v) return JSON.parse(v);
		} catch {
			const v = await AsyncStorage.getItem(TOKENS_KEY);
			if (v) return JSON.parse(v);
		}
	}
	return null;
}

async function saveUser(user: User | null) {
	const json = user ? JSON.stringify(user) : "";
	if (Platform.OS === "web") {
		if (user) await AsyncStorage.setItem(USER_KEY, json);
		else await AsyncStorage.removeItem(USER_KEY);
	} else {
		try {
			if (user) await setItemAsync(USER_KEY, json);
			else await deleteItemAsync(USER_KEY);
		} catch {
			if (user) await AsyncStorage.setItem(USER_KEY, json);
			else await AsyncStorage.removeItem(USER_KEY);
		}
	}
}

async function loadUser(): Promise<User | null> {
	if (Platform.OS === "web") {
		const v = await AsyncStorage.getItem(USER_KEY);
		console.log("AuthStore: loadUser AsyncStorage (web)", { hasValue: !!v });
		if (v) return JSON.parse(v);
	} else {
		try {
			const v = await getItemAsync(USER_KEY);
			console.log("AuthStore: loadUser SecureStore", { hasValue: !!v });
			if (v) return JSON.parse(v);
		} catch (e) {
			console.log("AuthStore: loadUser SecureStore failed", e);
			const v = await AsyncStorage.getItem(USER_KEY);
			console.log("AuthStore: loadUser AsyncStorage", { hasValue: !!v });
			if (v) return JSON.parse(v);
		}
	}
	return null;
}

export const useAuthStore = create<AuthState>((set, _get) => ({
	user: null,
	tokens: null,
	hydrate: async () => {
		const [tokens, user] = await Promise.all([loadTokens(), loadUser()]);
		console.log("AuthStore: Hydrated", {
			hasTokens: !!tokens,
			hasUser: !!user,
		});
		set({ tokens, user });
	},
	setAuth: async ({ user, tokens }) => {
		await Promise.all([saveTokens(tokens), saveUser(user)]);
		console.log("AuthStore: Set auth", {
			hasTokens: !!tokens,
			hasUser: !!user,
		});
		set({ user, tokens });
	},
	clear: async () => {
		await Promise.all([saveTokens(null), saveUser(null)]);
		console.log("AuthStore: Cleared auth");
		set({ user: null, tokens: null });
	},
}));
