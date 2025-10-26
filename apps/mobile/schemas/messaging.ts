import { z } from "zod";

export const messageSchema = z.object({
	body: z.string().nullish(),
	mediaId: z.uuid().nullish(),
	id: z.uuid(),
	chatId: z.uuid(),
	senderUserId: z.uuid(),
	sentAt: z.iso.datetime(),
});

export const messageCreateSchema = z.object({
	body: z.string().nullish(),
	mediaId: z.uuid().nullish(),
});

export const chatSchema = z.object({
	businessUserId: z.uuid(),
	clientUserId: z.uuid(),
	id: z.uuid(),
	createdAt: z.iso.datetime(),
});
