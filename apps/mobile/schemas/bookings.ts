import { z } from "zod";

export const bookingSchema = z.object({
	id: z.string().uuid(),
	serviceId: z.string().uuid(),
	cliqueId: z.string().uuid(),
	userId: z.string().uuid(),
	startTs: z.string().datetime(),
	endTs: z.string().datetime(),
	status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
	cancelledBy: z.enum(["owner", "client"]).nullish(),
	cancellationReason: z.string().nullish(),
	note: z.string().nullish(),
	idempotencyKey: z.string().nullish(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	service: z
		.object({
			title: z.string(),
			description: z.string().nullish(),
			durationMinutes: z.number(),
			priceMinor: z.number().nullish(),
			currency: z.string(),
		})
		.optional(),
	clique: z
		.object({
			name: z.string(),
			imageUrl: z.string().nullish(),
		})
		.optional(),
});

export const bookingCreateSchema = z.object({
	serviceId: z.string().uuid(),
	startTs: z.string().datetime(),
	note: z.string().nullish(),
	idempotencyKey: z.string().nullish(),
});

export const bookingRescheduleSchema = z.object({
	startTs: z.string().datetime(),
});

export const bookingStatusSchema = z.enum([
	"pending",
	"confirmed",
	"completed",
	"cancelled",
]);

export const cancelledBySchema = z.enum(["owner", "client"]);
