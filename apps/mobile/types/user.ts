export type User = {
	id: string;
	email: string;
	username: string;
	fullName?: string | null;
	bio?: string | null;
	profileImageUrl?: string | null;
	isBusinessPage: boolean;
	isPrivateAccount: boolean;
	isAdmin: boolean;
	isActive: boolean;
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
	isPrivateAccount?: boolean;
	isBusinessPage?: boolean;
};

export type UserSearchParams = {
	q?: string;
	occupationId?: string;
	sort?: string;
	cursor?: string;
	limit?: number;
};
