import type { CursorPage } from "./base";

export type Review = {
	rating: number;
	comment?: string | null;
	id: string;
	bookingId: string;
	raterUserId: string;
	createdAt: string;
	rater?: {
		username: string;
		fullName: string;
		profileImageUrl?: string;
	};
};

export type ReviewCreate = {
	rating: number;
	comment?: string | null;
};

export type CursorPageReviews = CursorPage<Review>;
