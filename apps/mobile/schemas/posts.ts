import { z } from "zod";

export const postSchema = z.object({
	contentFormat: z.enum(["markdown"]),
	content: z.string(),
	status: z.enum(["draft", "posted", "archived"]),
	id: z.string().uuid(),
	cliqueId: z.string().uuid(),
	authorUserId: z.string().uuid(),
	deletedAt: z.string().datetime().nullish(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	likesCount: z.number(),
	commentsCount: z.number(),
	likedByMe: z.boolean(),
	imageUrl: z.string().nullish(),
});

export const postCreateSchema = z.object({
	contentFormat: z.enum(["markdown"]).optional(),
	content: z.string(),
	status: z.enum(["draft", "posted", "archived"]).optional(),
});

export const postUpdateSchema = z.object({
	content: z.string().nullish(),
	status: z.enum(["draft", "posted", "archived"]).nullish(),
});

export const postStatusSchema = z.enum(["draft", "posted", "archived"]);

export const contentFormatSchema = z.enum(["markdown"]);

export const commentSchema = z.object({
	id: z.string().uuid(),
	postId: z.string().uuid(),
	userId: z.string().uuid(),
	body: z.string(),
	parentCommentId: z.string().uuid().nullish(),
	deletedAt: z.string().datetime().nullish(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const commentCreateSchema = z.object({
	body: z.string(),
	parentCommentId: z.string().uuid().nullish(),
});
