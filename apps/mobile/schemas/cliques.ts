import { z } from "zod";

export const cliqueSchema = z.object({
	name: z.string(),
	description: z.string().nullish(),
	imageUrl: z.string().nullish(),
	privacy: z.enum(["public", "private"]),
	timezone: z.string(),
	cancellationCutoffHours: z.number(),
	occupationIds: z.array(z.string().uuid()),
	id: z.string().uuid(),
	ownerUserId: z.string().uuid(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	memberCount: z.number().optional(),
	isMember: z.boolean().optional(),
	isOwner: z.boolean().optional(),
});

export const cliqueCreateSchema = z.object({
	name: z.string(),
	description: z.string().nullish(),
	imageUrl: z.string().nullish(),
	privacy: z.enum(["public", "private"]),
	timezone: z.string(),
	cancellationCutoffHours: z.number(),
	occupationIds: z.array(z.string().uuid()),
});

export const cliqueUpdateSchema = z.object({
	name: z.string().nullish(),
	description: z.string().nullish(),
	imageUrl: z.string().nullish(),
	privacy: z.enum(["public", "private"]).nullish(),
	timezone: z.string().nullish(),
	cancellationCutoffHours: z.number().nullish(),
	occupationIds: z.array(z.string().uuid()).nullish(),
});

export const cliqueMemberSchema = z.object({
	id: z.string().uuid(),
	cliqueId: z.string().uuid(),
	userId: z.string().uuid(),
	role: z.enum(["owner", "member"]),
	status: z.enum(["joined", "pending", "banned"]),
	createdAt: z.string().datetime(),
});

export const cliqueInviteSchema = z.object({
	id: z.string().uuid(),
	cliqueId: z.string().uuid(),
	token: z.string(),
	expiresAt: z.string().datetime().nullish(),
	maxUses: z.number().nullish(),
	uses: z.number(),
	createdAt: z.string().datetime(),
});

export const cliqueInviteCreateSchema = z.object({
	expiresAt: z.string().datetime().nullish(),
	maxUses: z.number().nullish(),
});

export const privacySchema = z.enum(["public", "private"]);

export const roleSchema = z.enum(["owner", "member"]);

export const membershipStatusSchema = z.enum(["joined", "pending", "banned"]);
