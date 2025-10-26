import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as posts from "@/api/posts";
import { useAuthStore } from "@/stores/auth-store";

export function useCreatePostMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			cliqueId,
			body,
		}: {
			cliqueId: string;
			body: Parameters<typeof posts.createPost>[1];
		}) => posts.createPost(cliqueId, body),
		onSuccess: (_, { cliqueId }) => {
			queryClient.invalidateQueries({
				queryKey: ["posts", "cliques", cliqueId],
			});
		},
	});
}

export function useListCliquePostsQuery(
	cliqueId: string | undefined,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["posts", "cliques", cliqueId, { cursor, limit }],
		queryFn: () => posts.listCliquePosts(cliqueId!, cursor, limit),
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useListUserPostsQuery(
	userId: string | undefined,
	enabled = true,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["posts", "user", userId, { cursor, limit }],
		queryFn: () => posts.listUserPosts(userId!, cursor, limit),
		enabled: !!tokens?.accessToken && !!userId && enabled,
	});
}

export function useGetPostQuery(postId: string | undefined) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["posts", postId],
		queryFn: () => posts.getPost(postId!),
		enabled: !!tokens?.accessToken && !!postId,
	});
}

export function useUpdatePostMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			postId,
			body,
		}: {
			postId: string;
			body: Parameters<typeof posts.updatePost>[1];
		}) => posts.updatePost(postId, body),
		onSuccess: (_, { postId }) => {
			queryClient.invalidateQueries({ queryKey: ["posts", postId] });
		},
	});
}

export function useDeletePostMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: posts.deletePost,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});
}

export function useLikePostMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: posts.likePost,
		onSuccess: (_, postId) => {
			queryClient.invalidateQueries({ queryKey: ["posts", postId] });
		},
	});
}

export function useUnlikePostMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: posts.unlikePost,
		onSuccess: (_, postId) => {
			queryClient.invalidateQueries({ queryKey: ["posts", postId] });
		},
	});
}

export function useCreateCommentMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			postId,
			body,
		}: {
			postId: string;
			body: Parameters<typeof posts.createComment>[1];
		}) => posts.createComment(postId, body),
		onSuccess: (_, { postId }) => {
			queryClient.invalidateQueries({ queryKey: ["posts", postId] });
		},
	});
}

export function useDeleteCommentMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: posts.deleteComment,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});
}
