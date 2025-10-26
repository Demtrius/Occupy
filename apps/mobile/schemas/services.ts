import { z } from "zod";

export const serviceSchema = z.object({
	title: z.string(),
	description: z.string().nullish(),
	priceMinor: z.number().nullish(),
	currency: z.string(),
	durationMinutes: z.number(),
	bufferMinutes: z.number(),
	isActive: z.boolean(),
	id: z.uuid(),
	cliqueId: z.uuid(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const serviceCreateSchema = z.object({
	title: z.string(),
	description: z.string().nullish(),
	priceMinor: z.number().nullish(),
	currency: z.string(),
	durationMinutes: z.number(),
	bufferMinutes: z.number(),
	isActive: z.boolean(),
});

export const serviceUpdateSchema = z.object({
	title: z.string().nullish(),
	description: z.string().nullish(),
	priceMinor: z.number().nullish(),
	durationMinutes: z.number().nullish(),
	bufferMinutes: z.number().nullish(),
	isActive: z.boolean().nullish(),
});
