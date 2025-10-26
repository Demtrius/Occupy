import type { CursorPage } from "./base";

export type User = {
	id: string;
	email: string;
	username: string;
	fullName: string;
	bio?: string | null;
	profileImageUrl?: string | null;
	isAdmin: boolean;
	isActive: boolean;
	isPrivateAccount: boolean;
	isBusinessPage: boolean;
	createdAt: string;
	updatedAt: string;
	followersCount: number;
	followingCount: number;
};

export type UserFollow = {
	id: string;
	username: string;
	fullName: string;
	profileImageUrl?: string | null;
	isBusinessPage: boolean;
	bio?: string | null;
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
	user: UserFollow;
};

export type FollowStatus = "pending" | "accepted" | "blocked";

export type CursorPageUsers = CursorPage<User>;

export type CursorPageFollows = CursorPage<Follow>;
