import { z } from "zod";

export const occupationSchema = z.object({
	name: z.string(),
	slug: z.string(),
	id: z.string().uuid(),
});
