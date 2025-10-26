import { z } from "zod";

export const availabilitySchema = z.object({
	isRecurring: z.boolean(),
	date: z.iso.date().nullish(),
	dayOfWeek: z.number().min(0).max(6).nullish(),
	startTime: z.string(),
	endTime: z.string(),
	validFrom: z.iso.date().nullish(),
	validUntil: z.iso.date().nullish(),
	timezone: z.string(),
	id: z.uuid(),
	cliqueId: z.uuid(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const availabilityCreateSchema = z.object({
	isRecurring: z.boolean(),
	date: z.iso.date().nullish(),
	dayOfWeek: z.number().min(0).max(6).nullish(),
	startTime: z.string(),
	endTime: z.string(),
	validFrom: z.iso.date().nullish(),
	validUntil: z.iso.date().nullish(),
	timezone: z.string(),
});

export const availabilityUpdateSchema = z.object({
	isRecurring: z.boolean().nullish(),
	date: z.iso.date().nullish(),
	dayOfWeek: z.number().min(0).max(6).nullish(),
	startTime: z.string().nullish(),
	endTime: z.string().nullish(),
	validFrom: z.iso.date().nullish(),
	validUntil: z.iso.date().nullish(),
	timezone: z.string().nullish(),
});
