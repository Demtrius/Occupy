import { api } from "@/lib/api-client";
import type { CursorPage } from "@/types/base";
import type {
	Comment,
	CommentCreate,
	Post,
	PostCreate,
	PostUpdate,
} from "@/types/posts";

export async function createPost(
	cliqueId: string,
	body: PostCreate,
): Promise<Post> {
	const response = await api.post(
		`/api/v1/posts/cliques/${cliqueId}/posts`,
		body,
	);
	return response.data as Post;
}

export async function listCliquePosts(
	cliqueId: string,
	cursor?: string,
	limit = 20,
): Promise<CursorPage<Post>> {
	const response = await api.get(`/api/v1/posts/cliques/${cliqueId}/posts`, {
		params: { limit, cursor },
	});
	return response.data as CursorPage<Post>;
}

export async function listUserPosts(
	userId: string,
	cursor?: string,
	limit = 20,
): Promise<CursorPage<Post>> {
	const response = await api.get(`/api/v1/posts/user/${userId}/posts`, {
		params: { limit, cursor },
	});
	return response.data as CursorPage<Post>;
}

export async function listFeedPosts(
	filter?: string,
	cursor?: string,
	limit = 20,
): Promise<CursorPage<Post>> {
	const response = await api.get(`/api/v1/posts/feed`, {
		params: { filter, limit, cursor },
	});
	return response.data as CursorPage<Post>;
}

export async function getPost(postId: string): Promise<Post> {
	const response = await api.get(`/api/v1/posts/${postId}`);
	return response.data as Post;
}

export async function updatePost(
	postId: string,
	body: PostUpdate,
): Promise<Post> {
	const response = await api.patch(`/api/v1/posts/${postId}`, body);
	return response.data as Post;
}

export async function deletePost(postId: string): Promise<void> {
	await api.delete(`/api/v1/posts/${postId}`);
}

export async function likePost(postId: string): Promise<Post> {
	const response = await api.post(`/api/v1/posts/${postId}/like`);
	return response.data as Post;
}

export async function unlikePost(postId: string): Promise<Post> {
	const response = await api.delete(`/api/v1/posts/${postId}/like`);
	return response.data as Post;
}

export async function createComment(
	postId: string,
	body: CommentCreate,
): Promise<Comment> {
	const response = await api.post(`/api/v1/posts/${postId}/comments`, body);
	return response.data as Comment;
}

export async function deleteComment(commentId: string): Promise<void> {
	await api.delete(`/api/v1/posts/comments/${commentId}`);
}
