import { z } from "zod";

export const mediaCreateSchema = z.object({
	url: z.string(),
	mime: z.string().nullish(),
	sizeBytes: z.number().nullish(),
	meta: z.object({}).loose().optional(),
});
