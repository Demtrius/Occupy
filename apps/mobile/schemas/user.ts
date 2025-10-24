import { z } from "zod";
import type { User } from "../types/user";

export const userSchema = z.object({
	id: z.string(),
	email: z.email(),
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
});

export function validateUser(data: any): User {
	return userSchema.parse(data);
}
