import { z } from "zod";
import type { Follow, User, UserUpdate } from "../types/users";

export const userSchema = z.object({
	id: z.uuid(),
	email: z.email(),
	username: z.string().min(3).max(32),
	fullName: z.string(),
	bio: z.string().nullish(),
	profileImageUrl: z.string().nullish(),
	isAdmin: z.boolean(),
	isActive: z.boolean(),
	isPrivateAccount: z.boolean(),
	isBusinessPage: z.boolean(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const userUpdateSchema = z.object({
	fullName: z.string().nullish(),
	bio: z.string().nullish(),
	profileImageUrl: z.string().nullish(),
	isPrivateAccount: z.boolean().nullish(),
});

export const followSchema = z.object({
	id: z.uuid(),
	followerUserId: z.uuid(),
	followeeUserId: z.uuid(),
	status: z.enum(["pending", "accepted", "blocked"]),
	createdAt: z.iso.datetime(),
});

export const followStatusSchema = z.enum(["pending", "accepted", "blocked"]);

export function validateUser(data: unknown): User {
	return userSchema.parse(data);
}

export function validateUserUpdate(data: unknown): UserUpdate {
	return userUpdateSchema.parse(data);
}

export function validateFollow(data: unknown): Follow {
	return followSchema.parse(data);
}
