import { z } from "zod";

export const slotSchema = z.object({
	startTs: z.string(),
	endTs: z.string(),
});
