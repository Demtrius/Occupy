import { create } from "zustand";
import { getItem, removeItem, setItem } from "@/lib/storage";
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
	if (tokens) await setItem(TOKENS_KEY, json);
	else await removeItem(TOKENS_KEY);
}

async function loadTokens(): Promise<Tokens> {
	const v = await getItem(TOKENS_KEY);
	if (v) return JSON.parse(v);
	return null;
}

async function saveUser(user: User | null) {
	const json = user ? JSON.stringify(user) : "";
	if (user) await setItem(USER_KEY, json);
	else await removeItem(USER_KEY);
}

async function loadUser(): Promise<User | null> {
	const v = await getItem(USER_KEY);
	if (v) return JSON.parse(v);
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
