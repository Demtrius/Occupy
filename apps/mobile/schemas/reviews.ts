import { z } from "zod";

export const reviewSchema = z.object({
	rating: z.number().min(1).max(5),
	comment: z.string().nullish(),
	id: z.uuid(),
	bookingId: z.uuid(),
	raterUserId: z.uuid(),
	createdAt: z.iso.datetime(),
	rater: z
		.object({
			username: z.string(),
			fullName: z.string().nullish(),
			profileImageUrl: z.string().nullish(),
		})
		.optional(),
});

export const reviewCreateSchema = z.object({
	rating: z.number().min(1).max(5),
	comment: z.string().nullish(),
});
