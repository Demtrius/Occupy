import type { CursorPage } from "./base";

export type Post = {
	contentFormat: ContentFormat;
	content: string;
	status: PostStatus;
	id: string;
	cliqueId: string;
	authorUserId: string;
	deletedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	likesCount: number;
	commentsCount: number;
	likedByMe: boolean;
	imageUrl?: string;
};

export type PostCreate = {
	contentFormat?: ContentFormat;
	content: string;
	status?: PostStatus;
};

export type PostUpdate = {
	content?: string | null;
	status?: PostStatus | null;
};

export type PostStatus = "draft" | "posted" | "archived";

export type ContentFormat = "markdown";

export type CursorPagePosts = CursorPage<Post>;

export type Comment = {
	id: string;
	postId: string;
	userId: string;
	body: string;
	parentCommentId?: string | null;
	deletedAt?: string | null;
	createdAt: string;
	updatedAt: string;
};

export type CommentCreate = {
	body: string;
	parentCommentId?: string | null;
};
