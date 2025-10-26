import { z } from "zod";
import type { LoginRequest, TokenRead, UserCreate } from "../types/auth";
import { userSchema } from "./users";

export const loginRequestSchema = z.object({
	emailOrUsername: z.string().min(1),
	password: z.string().min(1),
});

export const userCreateSchema = z.object({
	email: z.email(),
	username: z.string().min(3).max(32),
	fullName: z.string().nullish(),
	bio: z.string().nullish(),
	profileImageUrl: z.string().nullish(),
	isAdmin: z.boolean().default(false),
	isActive: z.boolean().default(true),
	isPrivateAccount: z.boolean().default(false),
	isBusinessPage: z.boolean().default(false),
	password: z.string(),
});

export const refreshRequestSchema = z.object({
	refreshToken: z.string(),
});

export const tokenReadSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	user: userSchema,
});

export function validateTokenRead(data: unknown): TokenRead {
	return tokenReadSchema.parse(data);
}

export function validateLoginRequest(data: unknown): LoginRequest {
	return loginRequestSchema.parse(data);
}

export function validateUserCreate(data: unknown): UserCreate {
	return userCreateSchema.parse(data);
}
