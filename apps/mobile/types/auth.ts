import type { User } from "./user";

export type TokenResponse = {
	accessToken: string;
	refreshToken: string;
	user: User;
};

export type LoginBody = {
	emailOrUsername: string;
	password: string;
};

export type RegisterBody = {
	email: string;
	username: string;
	password: string;
	fullName?: string;
};
