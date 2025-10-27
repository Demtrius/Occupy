import { z } from "zod";
import type {
	Follow,
	User,
	UserFollow,
	UserProfile,
	UserProfileUpdate,
	UserUpdate,
} from "../types/users";

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
	followersCount: z.number(),
	followingCount: z.number(),
});

export const userProfileSchema = z.object({
	id: z.uuid(),
	email: z.string().email(),
	username: z.string(),
	fullName: z.string(),
	bio: z.string().nullish(),
	profileImageUrl: z.string().nullish(),
	isBusinessPage: z.boolean(),
	isPrivateAccount: z.boolean(),
	isAdmin: z.boolean(),
	isActive: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
	// Additional fields for profile display
	followersCount: z.number().optional(),
	followingCount: z.number().optional(),
});

export const userFollowSchema = z.object({
	id: z.uuid(),
	username: z.string().min(3).max(32),
	fullName: z.string(),
	profileImageUrl: z.string().nullish(),
	isBusinessPage: z.boolean(),
	bio: z.string().nullish(),
});

export const userUpdateSchema = z.object({
	fullName: z.string().nullish(),
	bio: z.string().nullish(),
	profileImageUrl: z.string().nullish(),
	isPrivateAccount: z.boolean().nullish(),
});

export const userProfileUpdateSchema = z.object({
	fullName: z.string().nullish(),
	bio: z.string().nullish(),
	profileImageUrl: z.string().nullish(),
	isPrivateAccount: z.boolean().optional(),
	isBusinessPage: z.boolean().optional(),
	occupations: z.array(z.string()).optional(),
});

export const followSchema = z.object({
	id: z.uuid(),
	followerUserId: z.uuid(),
	followeeUserId: z.uuid(),
	status: z.enum(["pending", "accepted", "blocked"]),
	createdAt: z.iso.datetime(),
	user: userFollowSchema,
});

export const followStatusSchema = z.enum(["pending", "accepted", "blocked"]);

export type UserProfileUpdateForm = z.infer<typeof userProfileUpdateSchema>;

export function validateUser(data: unknown): User {
	return userSchema.parse(data);
}

export function validateUserProfile(data: unknown): UserProfile {
	return userProfileSchema.parse(data);
}

export function validateUserUpdate(data: unknown): UserUpdate {
	return userUpdateSchema.parse(data);
}

export function validateUserProfileUpdate(data: unknown): UserProfileUpdate {
	return userProfileUpdateSchema.parse(data);
}

export function validateFollow(data: unknown): Follow {
	return followSchema.parse(data);
}
