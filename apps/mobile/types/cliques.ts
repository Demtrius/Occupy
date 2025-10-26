import type { CursorPage } from "./base";

export type Clique = {
	name: string;
	description?: string | null;
	imageUrl?: string | null;
	privacy: Privacy;
	timezone: string;
	cancellationCutoffHours: number;
	occupationIds: string[];
	id: string;
	ownerUserId: string;
	createdAt: string;
	updatedAt: string;
	memberCount?: number;
	isMember?: boolean;
	isOwner?: boolean;
};

export type CliqueCreate = {
	name: string;
	description?: string | null;
	imageUrl?: string | null;
	privacy: Privacy;
	timezone: string;
	cancellationCutoffHours: number;
	occupationIds: string[];
};

export type CliqueUpdate = {
	name?: string | null;
	description?: string | null;
	imageUrl?: string | null;
	privacy?: Privacy | null;
	timezone?: string | null;
	cancellationCutoffHours?: number | null;
	occupationIds?: string[] | null;
};

export type CliqueMember = {
	id: string;
	cliqueId: string;
	userId: string;
	role: Role;
	status: MembershipStatus;
	createdAt: string;
};

export type CliqueInvite = {
	id: string;
	cliqueId: string;
	token: string;
	expiresAt?: string | null;
	maxUses?: number | null;
	uses: number;
	createdAt: string;
};

export type CliqueInviteCreate = {
	expiresAt?: string | null;
	maxUses?: number | null;
};

export type Privacy = "public" | "private";

export type Role = "owner" | "member";

export type MembershipStatus = "joined" | "pending" | "banned";

export type CursorPageCliques = CursorPage<Clique>;

export type CursorPageCliqueMembers = CursorPage<CliqueMember>;
