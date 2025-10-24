import { z } from "zod";
import type { LoginBody, RegisterBody, TokenResponse } from "../types/auth";
import { userSchema } from "./user";

export const loginSchema = z.object({
	emailOrUsername: z.string().min(1),
	password: z.string().min(1),
});

export const registerSchema = z.object({
	email: z.email(),
	username: z.string().min(1),
	password: z.string().min(1),
	fullName: z.string().optional(),
});

export const tokenResponseSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	user: userSchema,
});

export function validateTokenResponse(data: any): TokenResponse {
	return tokenResponseSchema.parse(data);
}

export function validateLoginBody(data: any): LoginBody {
	return loginSchema.parse(data);
}

export function validateRegisterBody(data: any): RegisterBody {
	return registerSchema.parse(data);
}
