import { z } from "zod";

export const messageSchema = z.object({
	body: z.string().nullish(),
	mediaId: z.string().uuid().nullish(),
	id: z.string().uuid(),
	chatId: z.string().uuid(),
	senderUserId: z.string().uuid(),
	sentAt: z.string().datetime(),
});

export const messageCreateSchema = z.object({
	body: z.string().nullish(),
	mediaId: z.string().uuid().nullish(),
});

export const chatSchema = z.object({
	businessUserId: z.string().uuid(),
	clientUserId: z.string().uuid(),
	id: z.string().uuid(),
	createdAt: z.string().datetime(),
});
