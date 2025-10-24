// /stores/auth-store.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
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

async function saveTokens(tokens: Tokens) {
	const json = tokens ? JSON.stringify(tokens) : "";
	try {
		if (tokens) await SecureStore.setItemAsync(TOKENS_KEY, json);
		else await SecureStore.deleteItemAsync(TOKENS_KEY);
	} catch {
		if (tokens) await AsyncStorage.setItem(TOKENS_KEY, json);
		else await AsyncStorage.removeItem(TOKENS_KEY);
	}
}

async function loadTokens(): Promise<Tokens> {
	try {
		const v = await SecureStore.getItemAsync(TOKENS_KEY);
		if (v) return JSON.parse(v);
	} catch {
		const v = await AsyncStorage.getItem(TOKENS_KEY);
		if (v) return JSON.parse(v);
	}
	return null;
}

export const useAuthStore = create<AuthState>((set, _get) => ({
	user: null,
	tokens: null,
	hydrate: async () => {
		const tokens = await loadTokens();
		set({ tokens });
	},
	setAuth: async ({ user, tokens }) => {
		await saveTokens(tokens);
		set({ user, tokens });
	},
	clear: async () => {
		await saveTokens(null);
		set({ user: null, tokens: null });
	},
}));
