// Post Types

import { User } from "./user";

export interface Post {
	id: number;
	content: string;
	caption: string;
	userId: number;
	cliqueId: number;
	occupier?: User;
	clique?: string;
	avatar?: string;
	posted?: string;
	createdAt?: string;
	updatedAt?: string;
	likesCount?: number;
	commentsCount?: number;
	isLiked?: boolean;
}

export interface CreatePostData {
	content: string;
	caption: string;
	cliqueId: number;
}

// Like Types
export interface Like {
	id: number;
	post: number;
	user: User;
	createdAt: string;
}

export interface CreateLikeData {
	postId: number;
}

// Comment Types
export interface Comment {
	id: number;
	post: number;
	user: User;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCommentData {
	postId: number;
	content: string;
}

export interface UpdateCommentData {
	content: string;
}

// Review Types
export interface Review {
	id: number;
	booking: number;
	clique: number;
	cliqueName?: string;
	reviewer: User;
	rating: number;
	comment?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateReviewData {
	bookingId: number;
	rating: number;
	comment?: string;
}

export interface UpdateReviewData {
	rating?: number;
	comment?: string;
}
