import { z } from "zod";

export const cliqueSchema = z.object({
	name: z.string(),
	description: z.string().nullish(),
	imageUrl: z.string().nullish(),
	privacy: z.enum(["public", "private"]),
	timezone: z.string(),
	cancellationCutoffHours: z.number(),
	occupationIds: z.array(z.uuid()),
	id: z.uuid(),
	ownerUserId: z.uuid(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
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
	occupationIds: z.array(z.uuid()),
});

export const cliqueUpdateSchema = z.object({
	name: z.string().nullish(),
	description: z.string().nullish(),
	imageUrl: z.string().nullish(),
	privacy: z.enum(["public", "private"]).nullish(),
	timezone: z.string().nullish(),
	cancellationCutoffHours: z.number().nullish(),
	occupationIds: z.array(z.uuid()).nullish(),
});

export const cliqueMemberSchema = z.object({
	id: z.uuid(),
	cliqueId: z.uuid(),
	userId: z.uuid(),
	role: z.enum(["owner", "member"]),
	status: z.enum(["joined", "pending", "banned"]),
	createdAt: z.iso.datetime(),
});

export const cliqueInviteSchema = z.object({
	id: z.uuid(),
	cliqueId: z.uuid(),
	token: z.string(),
	expiresAt: z.iso.datetime().nullish(),
	maxUses: z.number().nullish(),
	uses: z.number(),
	createdAt: z.iso.datetime(),
});

export const cliqueInviteCreateSchema = z.object({
	expiresAt: z.iso.datetime().nullish(),
	maxUses: z.number().nullish(),
});

export const privacySchema = z.enum(["public", "private"]);

export const roleSchema = z.enum(["owner", "member"]);

export const membershipStatusSchema = z.enum(["joined", "pending", "banned"]);
