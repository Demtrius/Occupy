import { z } from "zod";

export const postSchema = z.object({
	contentFormat: z.enum(["markdown"]),
	content: z.string(),
	status: z.enum(["draft", "posted", "archived"]),
	id: z.uuid(),
	cliqueId: z.uuid(),
	authorUserId: z.uuid(),
	deletedAt: z.iso.datetime().nullish(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
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
	id: z.uuid(),
	postId: z.uuid(),
	userId: z.uuid(),
	body: z.string(),
	parentCommentId: z.uuid().nullish(),
	deletedAt: z.iso.datetime().nullish(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const commentCreateSchema = z.object({
	body: z.string(),
	parentCommentId: z.uuid().nullish(),
});
