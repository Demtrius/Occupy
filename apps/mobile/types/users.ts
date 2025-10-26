import type { CursorPage } from "./base";

export type User = {
	id: string;
	email: string;
	username: string;
	fullName?: string | null;
	bio?: string | null;
	profileImageUrl?: string | null;
	isAdmin: boolean;
	isActive: boolean;
	isPrivateAccount: boolean;
	isBusinessPage: boolean;
	createdAt: string;
	updatedAt: string;
	// Additional fields for profile display
	occupations?: Array<{ id: string; name: string; slug: string }>;
	followersCount?: number;
	followingCount?: number;
	postsCount?: number;
	cliquesCount?: number;
	isFollowing?: boolean;
	isFollowRequested?: boolean;
	isBlocked?: boolean;
};

export type UserUpdate = {
	fullName?: string | null;
	bio?: string | null;
	profileImageUrl?: string | null;
	isPrivateAccount?: boolean | null;
};

export type Follow = {
	id: string;
	followerUserId: string;
	followeeUserId: string;
	status: FollowStatus;
	createdAt: string;
};

export type FollowStatus = "pending" | "accepted" | "blocked";

export type CursorPageUsers = CursorPage<User>;

export type CursorPageFollows = CursorPage<Follow>;
