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
	payload: z.object({}).loose(),
	isRead: z.boolean(),
	readAt: z.iso.datetime().nullish(),
	id: z.uuid(),
	userId: z.uuid(),
	createdAt: z.iso.datetime(),
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
