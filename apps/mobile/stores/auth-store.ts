import { create } from "zustand";
import { getItem, removeItem, setItem } from "@/lib/storage";

type Tokens = { accessToken: string; refreshToken: string } | null;

type AuthState = {
	tokens: Tokens;
	hydrate: () => Promise<void>;
	setAuth: (tokens: Tokens) => Promise<void>;
	clear: () => Promise<void>;
};

const TOKENS_KEY = "auth.tokens";

async function saveTokens(tokens: Tokens) {
	const json = tokens ? JSON.stringify(tokens) : "";
	if (tokens) await setItem(TOKENS_KEY, json);
	else await removeItem(TOKENS_KEY);
}

async function loadTokens(): Promise<Tokens> {
	const v = await getItem(TOKENS_KEY);
	if (v) return JSON.parse(v);
	return null;
}

export const useAuthStore = create<AuthState>((set, _get) => ({
	tokens: null,
	hydrate: async () => {
		const tokens = await loadTokens();
		// Auth store hydrated
		set({ tokens });
	},
	setAuth: async (tokens) => {
		await saveTokens(tokens);
		// Auth store set
		set({ tokens });
	},
	clear: async () => {
		await saveTokens(null);
		// Auth store cleared
		set({ tokens: null });
	},
}));
