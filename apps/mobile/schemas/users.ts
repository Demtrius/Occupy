import { z } from "zod";
import type { Follow, FollowStatus, User, UserUpdate } from "../types/users";

export const userSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	username: z.string().min(3).max(32),
	fullName: z.string().nullish(),
	bio: z.string().nullish(),
	profileImageUrl: z.string().nullish(),
	isAdmin: z.boolean(),
	isActive: z.boolean(),
	isPrivateAccount: z.boolean(),
	isBusinessPage: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const userUpdateSchema = z.object({
	fullName: z.string().nullish(),
	bio: z.string().nullish(),
	profileImageUrl: z.string().nullish(),
	isPrivateAccount: z.boolean().nullish(),
});

export const followSchema = z.object({
	id: z.string().uuid(),
	followerUserId: z.string().uuid(),
	followeeUserId: z.string().uuid(),
	status: z.enum(["pending", "accepted", "blocked"]),
	createdAt: z.string().datetime(),
});

export const followStatusSchema = z.enum(["pending", "accepted", "blocked"]);

export function validateUser(data: any): User {
	return userSchema.parse(data);
}

export function validateUserUpdate(data: any): UserUpdate {
	return userUpdateSchema.parse(data);
}

export function validateFollow(data: any): Follow {
	return followSchema.parse(data);
}
