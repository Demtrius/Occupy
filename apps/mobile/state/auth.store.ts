import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

type Tokens = { accessToken: string; refreshToken: string } | null;

type AuthState = {
	user: { id: string; username: string } | null;
	tokens: Tokens;
	setAuth: (p: { user: any; tokens: Tokens }) => Promise<void>;
	clear: () => Promise<void>;
	hydrate: () => Promise<void>;
};

const key = "auth.tokens";

async function saveTokens(tokens: Tokens) {
	const json = tokens ? JSON.stringify(tokens) : "";
	try {
		if (tokens) await SecureStore.setItemAsync(key, json);
		else await SecureStore.deleteItemAsync(key);
	} catch {
		if (tokens) await AsyncStorage.setItem(key, json);
		else await AsyncStorage.removeItem(key);
	}
}

async function loadTokens(): Promise<Tokens> {
	try {
		const v = await SecureStore.getItemAsync(key);
		if (v) return JSON.parse(v);
	} catch {
		const v = await AsyncStorage.getItem(key);
		if (v) return JSON.parse(v);
	}
	return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
	user: null,
	tokens: null,
	setAuth: async ({ user, tokens }) => {
		await saveTokens(tokens);
		set({ user, tokens });
	},
	clear: async () => {
		await saveTokens(null);
		set({ user: null, tokens: null });
	},
	hydrate: async () => {
		const tokens = await loadTokens();
		set({ tokens });
	},
}));
