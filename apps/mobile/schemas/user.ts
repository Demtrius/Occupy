import { z } from "zod";
import type { User } from "../types/user";

export const userSchema = z.object({
	id: z.uuid(),
	email: z.string().email(),
	username: z.string(),
	fullName: z.string().nullish(),
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

export const userUpdateSchema = z.object({
	fullName: z.string().nullish(),
	bio: z.string().nullish(),
	profileImageUrl: z.string().nullish(),
	isPrivateAccount: z.boolean().optional(),
	isBusinessPage: z.boolean().optional(),
});

export type UserUpdateForm = z.infer<typeof userUpdateSchema>;

export function validateUser(data: unknown): User {
	return userSchema.parse(data);
}
