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

type FollowVariables = RequestOptions<operations["UsersFollow"]>;
type UnfollowVariables = RequestOptions<operations["UsersDeleteFollowerById"]>;
type FollowApproveVariables = RequestOptions<operations["UsersFollowApprove"]>;
type FollowRejectVariables = RequestOptions<operations["UsersFollowReject"]>;
type FollowBlockVariables = RequestOptions<operations["UsersFollowBlock"]>;
type FollowUnblockVariables = RequestOptions<operations["UsersFollowUnblock"]>;
type UpdateUserVariables = RequestOptions<operations["UsersUpdateMe"]>;

type SearchUsersParams = NonNullable<
	RequestOptions<operations["Users"]>["params"]
>["query"];

type FollowStatusVariables = RequestOptions<operations["UsersFollowingStatus"]>;

type Follow = components["schemas"]["Follow"];
type FollowersPage = components["schemas"]["CursorPageFollows"];
type FollowingPage = components["schemas"]["CursorPageFollows"];

export const userKeys = {
	all: ["users"] as const,
	me: ["users", "me"] as const,
	detail: (userId: string) => ["users", "detail", userId] as const,
	followersBase: (userId: string) =>
		["users", "detail", userId, "followers"] as const,
	followingBase: (userId: string) =>
		["users", "detail", userId, "following"] as const,
	status: (userId: string) => ["users", "detail", userId, "status"] as const,
	search: (params: SearchUsersParams) =>
		[
			"users",
			"search",
			params?.q ?? "",
			params?.occupationId ?? "",
			params?.sort ?? "",
			params?.cursor ?? "",
			params?.limit ?? null,
		] as const,
};

export function useMeQuery() {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: userKeys.me,
		enabled: Boolean(tokens?.accessToken),
		retry: false,
		queryFn: async () => ensureData(await $api.GET("/api/v1/users/me")),
	});
}

export function useUserQuery(userId: string | undefined) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: userKeys.detail(userId ?? ""),
		enabled: Boolean(tokens?.accessToken) && Boolean(userId),
		retry: false,
		queryFn: async () =>
			ensureData(
				await $api.GET("/api/v1/users/{userId}", {
					params: { path: { userId: userId! } },
				}),
			),
	});
}

export function useFollowMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: FollowVariables) =>
			ensureData(await $api.POST("/api/v1/users/{userId}/follow", variables)),
		onSuccess: (_data, variables) => {
			const userId = variables.params?.path?.userId;
			if (!userId) return;
			queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
			queryClient.invalidateQueries({ queryKey: userKeys.me });
			queryClient.invalidateQueries({ queryKey: userKeys.status(userId) });
			queryClient.invalidateQueries({
				queryKey: userKeys.followersBase(userId),
				exact: false,
			});
			queryClient.invalidateQueries({
				queryKey: userKeys.followingBase(userId),
				exact: false,
			});
		},
	});
}

export function useUnfollowMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: UnfollowVariables) =>
			ensureData(
				await $api.DELETE(
					"/api/v1/users/{userId}/follow/followers/{followerId}",
					variables,
				),
			),
		onSuccess: (_data, variables) => {
			const userId = variables.params?.path?.userId;
			if (!userId) return;
			queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
			queryClient.invalidateQueries({ queryKey: userKeys.me });
			queryClient.invalidateQueries({ queryKey: userKeys.status(userId) });
			queryClient.invalidateQueries({
				queryKey: userKeys.followersBase(userId),
				exact: false,
			});
			queryClient.invalidateQueries({
				queryKey: userKeys.followingBase(userId),
				exact: false,
			});
		},
	});
}

export function useBlockMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: FollowBlockVariables) =>
			ensureData(
				await $api.POST("/api/v1/users/{userId}/follow/block", variables),
			),
		onSuccess: (_data, variables) => {
			const userId = variables.params?.path?.userId;
			if (!userId) return;
			queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
			queryClient.invalidateQueries({ queryKey: userKeys.me });
			queryClient.invalidateQueries({ queryKey: userKeys.status(userId) });
		},
	});
}

export function useUnblockMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: FollowUnblockVariables) =>
			ensureData(
				await $api.DELETE("/api/v1/users/{userId}/follow/block", variables),
			),
		onSuccess: (_data, variables) => {
			const userId = variables.params?.path?.userId;
			if (!userId) return;
			queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
			queryClient.invalidateQueries({ queryKey: userKeys.me });
			queryClient.invalidateQueries({ queryKey: userKeys.status(userId) });
		},
	});
}

export function useUpdateUserMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: UpdateUserVariables) =>
			ensureData(await $api.PATCH("/api/v1/users/me", variables)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userKeys.me });
			queryClient.invalidateQueries({ queryKey: userKeys.all, exact: false });
		},
	});
}

export function useSearchUsersQuery(params: SearchUsersParams) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: userKeys.search(params),
		enabled: Boolean(tokens?.accessToken),
		queryFn: async () =>
			ensureData(
				await $api.GET("/api/v1/users", {
					params: { query: params },
				}),
			),
	});
}

export function useApproveFollowMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: FollowApproveVariables) =>
			ensureData(
				await $api.POST("/api/v1/users/{userId}/follow/approve", variables),
			),
		onSuccess: (_data, variables) => {
			const userId = variables.params?.path?.userId;
			if (!userId) return;
			queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
			queryClient.invalidateQueries({ queryKey: userKeys.me });
			queryClient.invalidateQueries({ queryKey: userKeys.status(userId) });
			queryClient.invalidateQueries({
				queryKey: userKeys.followersBase(userId),
				exact: false,
			});
		},
	});
}

export function useRejectFollowMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: FollowRejectVariables) =>
			ensureData(
				await $api.POST("/api/v1/users/{userId}/follow/reject", variables),
			),
		onSuccess: (_data, variables) => {
			const userId = variables.params?.path?.userId;
			if (!userId) return;
			queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
			queryClient.invalidateQueries({ queryKey: userKeys.me });
			queryClient.invalidateQueries({ queryKey: userKeys.status(userId) });
		},
	});
}

export function useRemoveFollowerMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: UnfollowVariables) =>
			ensureData(
				await $api.DELETE(
					"/api/v1/users/{userId}/follow/followers/{followerId}",
					variables,
				),
			),
		onSuccess: (_data, variables) => {
			const userId = variables.params?.path?.userId;
			if (!userId) return;
			queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
			queryClient.invalidateQueries({ queryKey: userKeys.me });
			queryClient.invalidateQueries({ queryKey: userKeys.status(userId) });
			queryClient.invalidateQueries({
				queryKey: userKeys.followersBase(userId),
				exact: false,
			});
		},
	});
}

export function useListFollowersQuery(userId: string | undefined, limit = 20) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<FollowersPage>({
		queryKey: [...userKeys.followersBase(userId ?? ""), { limit }],
		enabled: Boolean(tokens?.accessToken) && Boolean(userId),
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/users/{userId}/follow/followers", {
					params: {
						path: { userId: userId! },
						query: { cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
	return withCursorHelpers<Follow, FollowersPage>(query);
}

export function useListFollowingQuery(userId: string | undefined, limit = 20) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<FollowingPage>({
		queryKey: [...userKeys.followingBase(userId ?? ""), { limit }],
		enabled: Boolean(tokens?.accessToken) && Boolean(userId),
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/users/{userId}/follow/following", {
					params: {
						path: { userId: userId! },
						query: { cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
	return withCursorHelpers<Follow, FollowingPage>(query);
}

export function useFollowStatusQuery(userId: string | undefined) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: userKeys.status(userId ?? ""),
		enabled: Boolean(tokens?.accessToken) && Boolean(userId),
		retry: false,
		queryFn: async () =>
			ensureData(
				await $api.GET("/api/v1/users/{userId}/follow/status", {
					params: { path: { userId: userId! } },
				}),
			),
	});
}
