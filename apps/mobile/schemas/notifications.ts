import { z } from "zod";

export const notificationSchema = z.object({
	type: z.enum([
		"like",
		"comment",
		"follow",
		"booking_request",
		"booking_confirmed",
		"booking_cancelled",
		"review",
		"system",
		"message",
	]),
	payload: z.object({}).passthrough(),
	isRead: z.boolean(),
	readAt: z.string().datetime().nullish(),
	id: z.string().uuid(),
	userId: z.string().uuid(),
	createdAt: z.string().datetime(),
});

export const notificationTypeSchema = z.enum([
	"like",
	"comment",
	"follow",
	"booking_request",
	"booking_confirmed",
	"booking_cancelled",
	"review",
	"system",
	"message",
]);
