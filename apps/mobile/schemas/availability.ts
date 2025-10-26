import { z } from "zod";

export const availabilitySchema = z.object({
	isRecurring: z.boolean(),
	date: z.string().date().nullish(),
	dayOfWeek: z.number().min(0).max(6).nullish(),
	startTime: z.string(),
	endTime: z.string(),
	validFrom: z.string().date().nullish(),
	validUntil: z.string().date().nullish(),
	timezone: z.string(),
	id: z.string().uuid(),
	cliqueId: z.string().uuid(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const availabilityCreateSchema = z.object({
	isRecurring: z.boolean(),
	date: z.string().date().nullish(),
	dayOfWeek: z.number().min(0).max(6).nullish(),
	startTime: z.string(),
	endTime: z.string(),
	validFrom: z.string().date().nullish(),
	validUntil: z.string().date().nullish(),
	timezone: z.string(),
});

export const availabilityUpdateSchema = z.object({
	isRecurring: z.boolean().nullish(),
	date: z.string().date().nullish(),
	dayOfWeek: z.number().min(0).max(6).nullish(),
	startTime: z.string().nullish(),
	endTime: z.string().nullish(),
	validFrom: z.string().date().nullish(),
	validUntil: z.string().date().nullish(),
	timezone: z.string().nullish(),
});
