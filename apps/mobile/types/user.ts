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
};
