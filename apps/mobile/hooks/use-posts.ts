import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { RequestOptions } from "openapi-fetch";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { components, operations } from "@/types/generated";
import { withCursorHelpers } from "./utils";

type Post = components["schemas"]["Post"];
type Comment = components["schemas"]["Comment"];
type PostsPage = components["schemas"]["CursorPagePosts"];

type FeedFilter = "all" | "followings" | "cliques";

interface UseFeedPostsOptions {
	filter?: FeedFilter;
	enabled?: boolean;
	limit?: number;
}

type CreatePostVariables = RequestOptions<
	operations["PostsCreateCliquesPosts"]
>;
type UpdatePostVariables = RequestOptions<operations["PostsUpdateById"]>;
type DeletePostVariables = RequestOptions<operations["PostsDeleteById"]>;
type LikePostVariables = RequestOptions<operations["PostsLike"]>;
type UnlikePostVariables = RequestOptions<operations["PostsUnlike"]>;
type CreateCommentVariables = RequestOptions<operations["PostsCreateComments"]>;
type DeleteCommentVariables = RequestOptions<
	operations["PostsDeleteCommentsById"]
>;

export function useCreatePostMutation() {
	const queryClient = useQueryClient();
	return useMutation<Post, unknown, CreatePostVariables>({
		mutationFn: async (variables) =>
			ensureData(
				await $api.POST("/api/v1/posts/cliques/{cliqueId}/posts", variables),
			),
		onSuccess: (post, variables) => {
			const cliqueId = variables.params?.path?.cliqueId ?? post?.cliqueId;
			if (cliqueId) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "clique", cliqueId],
					exact: false,
				});
			}
			if (post?.authorUserId) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "user", post.authorUserId],
					exact: false,
				});
			}
			queryClient.invalidateQueries({
				queryKey: ["posts", "feed"],
				exact: false,
			});
			queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
			if (post?.id) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "detail", post.id],
				});
			}
		},
	});
}

export function useGetPostQuery(postId: string | undefined) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["posts", "detail", postId ?? ""],
		enabled: Boolean(tokens?.accessToken) && Boolean(postId),
		queryFn: async () => {
			if (!postId) {
				throw new Error("postId is required");
			}
			return ensureData(
				await $api.GET("/api/v1/posts/{postId}", {
					params: {
						path: { postId },
					},
				}),
			);
		},
	});
}

export function useUpdatePostMutation() {
	const queryClient = useQueryClient();
	return useMutation<Post, unknown, UpdatePostVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.PATCH("/api/v1/posts/{postId}", variables)),
		onSuccess: (post, variables) => {
			const postId = variables.params?.path?.postId ?? post?.id;
			if (postId) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "detail", postId],
				});
			}
			if (post?.cliqueId) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "clique", post.cliqueId],
					exact: false,
				});
			}
			if (post?.authorUserId) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "user", post.authorUserId],
					exact: false,
				});
			}
			queryClient.invalidateQueries({
				queryKey: ["posts", "feed"],
				exact: false,
			});
		},
	});
}

export function useDeletePostMutation() {
	const queryClient = useQueryClient();
	return useMutation<void, unknown, DeletePostVariables>({
		mutationFn: async (variables) => {
			const result = await $api.DELETE("/api/v1/posts/{postId}", variables);
			if (result.error) {
				throw result.error;
			}
		},
		onSuccess: (_data, variables) => {
			const postId = variables.params?.path?.postId;
			if (postId) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "detail", postId],
				});
			}
			queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
			queryClient.invalidateQueries({
				queryKey: ["posts", "feed"],
				exact: false,
			});
		},
	});
}

export function useLikePostMutation() {
	const queryClient = useQueryClient();
	return useMutation<Post, unknown, LikePostVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.POST("/api/v1/posts/{postId}/like", variables)),
		onSuccess: (post, variables) => {
			const postId = variables.params?.path?.postId ?? post?.id;
			if (postId) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "detail", postId],
				});
			}
		},
	});
}

export function useUnlikePostMutation() {
	const queryClient = useQueryClient();
	return useMutation<Post, unknown, UnlikePostVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.DELETE("/api/v1/posts/{postId}/like", variables)),
		onSuccess: (post, variables) => {
			const postId = variables.params?.path?.postId ?? post?.id;
			if (postId) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "detail", postId],
				});
			}
		},
	});
}

export function useCreateCommentMutation() {
	const queryClient = useQueryClient();
	return useMutation<Comment, unknown, CreateCommentVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.POST("/api/v1/posts/{postId}/comments", variables)),
		onSuccess: (_comment, variables) => {
			const postId = variables.params?.path?.postId;
			if (postId) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "detail", postId],
				});
			}
		},
	});
}

export function useDeleteCommentMutation() {
	const queryClient = useQueryClient();
	return useMutation<void, unknown, DeleteCommentVariables>({
		mutationFn: async (variables) => {
			const result = await $api.DELETE(
				"/api/v1/posts/comments/{commentId}",
				variables,
			);
			if (result.error) {
				throw result.error;
			}
		},
		onSuccess: (_data, _variables) => {
			queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
		},
	});
}

export function useFeedPosts({
	filter = "all",
	enabled = true,
	limit = 20,
}: UseFeedPostsOptions = {}) {
	const { tokens } = useAuthStore();
	const filterParam = filter === "all" ? undefined : filter;
	const query = useInfiniteQuery<PostsPage>({
		queryKey: ["posts", "feed", filter, { limit }],
		enabled: Boolean(tokens?.accessToken) && enabled,
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/posts/feed", {
					params: {
						query: {
							cursor,
							limit,
							...(filterParam ? { filter: filterParam } : {}),
						},
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	return withCursorHelpers<Post, PostsPage>(query);
}

export function useListCliquePostsQuery(
	cliqueId: string | undefined,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<PostsPage>({
		queryKey: ["posts", "clique", cliqueId ?? "", { limit }],
		enabled: Boolean(tokens?.accessToken) && Boolean(cliqueId),
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			if (!cliqueId) {
				throw new Error("cliqueId is required");
			}
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/posts/cliques/{cliqueId}/posts", {
					params: {
						path: { cliqueId },
						query: { cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	return withCursorHelpers<Post, PostsPage>(query);
}

export function useListUserPostsQuery(
	userId: string | undefined,
	enabled = true,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<PostsPage>({
		queryKey: ["posts", "user", userId ?? "", { limit }],
		enabled: Boolean(tokens?.accessToken) && Boolean(userId) && enabled,
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			if (!userId) {
				throw new Error("userId is required");
			}
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/posts/user/{userId}/posts", {
					params: {
						path: { userId },
						query: { cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	return withCursorHelpers<Post, PostsPage>(query);
}
