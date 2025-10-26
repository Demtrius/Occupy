import { z } from "zod";

export const userSearchParamsSchema = z.object({
	q: z.string().optional(),
	occupationId: z.uuid().nullish(),
	sort: z.string().optional(),
	cursor: z.string().optional(),
	limit: z.number().optional(),
});
