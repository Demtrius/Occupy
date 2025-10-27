import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useCreatePostMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/posts/cliques/{cliqueId}/posts", {
		onSuccess: (data, variables) => {
			const cliqueId = variables.params.path.cliqueId;
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
	return $api.useQuery("get", "/api/v1/posts/cliques/{cliqueId}/posts", {
		params: {
			path: { cliqueId: cliqueId! },
			query: { cursor, limit },
		},
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
	return $api.useQuery("get", "/api/v1/posts/user/{userId}/posts", {
		params: {
			path: { userId: userId! },
			query: { cursor, limit },
		},
		enabled: !!tokens?.accessToken && !!userId && enabled,
	});
}

export function useGetPostQuery(postId: string | undefined) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/posts/{postId}", {
		params: {
			path: { postId: postId! },
		},
		enabled: !!tokens?.accessToken && !!postId,
	});
}

export function useUpdatePostMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("patch", "/api/v1/posts/{postId}", {
		onSuccess: (data, variables) => {
			const postId = variables.params.path.postId;
			queryClient.invalidateQueries({ queryKey: ["posts", postId] });
		},
	});
}

export function useDeletePostMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("delete", "/api/v1/posts/{postId}", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});
}

export function useLikePostMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/posts/{postId}/like", {
		onSuccess: (data, variables) => {
			const postId = variables.params.path.postId;
			queryClient.invalidateQueries({ queryKey: ["posts", postId] });
		},
	});
}

export function useUnlikePostMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("delete", "/api/v1/posts/{postId}/like", {
		onSuccess: (data, variables) => {
			const postId = variables.params.path.postId;
			queryClient.invalidateQueries({ queryKey: ["posts", postId] });
		},
	});
}

export function useCreateCommentMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/posts/{postId}/comments", {
		onSuccess: (data, variables) => {
			const postId = variables.params.path.postId;
			queryClient.invalidateQueries({ queryKey: ["posts", postId] });
		},
	});
}

export function useDeleteCommentMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("delete", "/api/v1/posts/comments/{commentId}", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});
}

type FeedFilter = "all" | "followings" | "cliques";

interface UseFeedPostsOptions {
	filter?: FeedFilter;
	enabled?: boolean;
}

export function useFeedPosts({
	filter = "all",
	enabled = true,
}: UseFeedPostsOptions = {}) {
	const { tokens } = useAuthStore();
	const filterParam = filter === "all" ? undefined : filter;
	return $api.useQuery("get", "/api/v1/posts/feed", {
		params: {
			query: filterParam ? { filter: filterParam } : undefined,
		},
		enabled: !!tokens?.accessToken && enabled,
	});
}
