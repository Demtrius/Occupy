import type { User } from "./users";

export type UserCreate = {
	email: string;
	username: string;
	fullName?: string | null;
	bio?: string | null;
	profileImageUrl?: string | null;
	isAdmin?: boolean;
	isActive?: boolean;
	isPrivateAccount?: boolean;
	isBusinessPage?: boolean;
	password: string;
};

export type LoginRequest = {
	emailOrUsername: string;
	password: string;
};

export type RefreshRequest = {
	refreshToken: string;
};

export type TokenRead = {
	accessToken: string;
	refreshToken: string;
	user: User;
};

// Aliases for backward compatibility
export type RegisterBody = UserCreate;
export type LoginBody = LoginRequest;
export type TokenResponse = TokenRead;
