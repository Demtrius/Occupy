// Types for profile-related data

export interface Post {
	id: string;
	cliqueId: string;
	authorUserId: string;
	content: string;
	status: "draft" | "posted" | "archived";
	imageUrl?: string;
	likesCount: number;
	commentsCount: number;
	likedByMe: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Clique {
	id: string;
	ownerUserId: string;
	name: string;
	description: string;
	privacy: "public" | "private";
	timezone: string;
	imageUrl?: string;
	memberCount?: number;
	isMember?: boolean;
	isOwner?: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Booking {
	id: string;
	cliqueId: string;
	serviceId: string;
	userId: string;
	startTs: string;
	endTs: string;
	status: "pending" | "confirmed" | "completed" | "cancelled";
	cancellationReason?: string;
	notes?: string;
	service?: {
		title: string;
		description: string;
		duration: number;
		priceMinor: number;
		currency: string;
	};
	clique?: {
		name: string;
		imageUrl?: string;
	};
}

export interface Review {
	id: string;
	bookingId: string;
	raterUserId: string;
	rating: number; // 1-5
	comment?: string;
	createdAt: string;
	rater?: {
		username: string;
		fullName?: string;
		profileImageUrl?: string;
	};
}

export interface CursorPage<T> {
	items: T[];
	nextCursor?: string;
}
