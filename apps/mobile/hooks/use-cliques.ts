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

type Clique = components["schemas"]["Clique"];
type CliqueMember = components["schemas"]["CliqueMember"];
type CliqueInvite = components["schemas"]["CliqueInvite"];
type CliquePage = components["schemas"]["CursorPageCliques"];
type MembersPage = components["schemas"]["CursorPageCliqueMembers"];
type PostsPage = components["schemas"]["CursorPagePosts"];

type CreateCliqueVariables = RequestOptions<operations["CliquesCreate"]>;
type UpdateCliqueVariables = RequestOptions<operations["CliquesUpdateById"]>;
type DeleteCliqueVariables = RequestOptions<operations["CliquesDeleteById"]>;
type JoinCliqueVariables = RequestOptions<operations["CliquesJoin"]>;
type LeaveCliqueVariables = RequestOptions<operations["CliquesLeave"]>;
type ApproveMemberVariables = RequestOptions<
	operations["CliquesMembersApprove"]
>;
type RejectMemberVariables = RequestOptions<operations["CliquesMembersReject"]>;
type CreateInviteVariables = RequestOptions<operations["CliquesInvites"]>;

const cliqueKeys = {
	all: ["cliques"] as const,
	list: (limit: number) => ["cliques", "list", { limit }] as const,
	detail: (cliqueId: string) => ["cliques", "detail", cliqueId] as const,
	membersBase: (cliqueId: string) => ["cliques", "members", cliqueId] as const,
	members: (cliqueId: string, limit: number) =>
		["cliques", "members", cliqueId, { limit }] as const,
	pendingBase: (cliqueId: string) => ["cliques", "pending", cliqueId] as const,
	pending: (cliqueId: string, limit: number) =>
		["cliques", "pending", cliqueId, { limit }] as const,
	userBase: (userId: string) => ["cliques", "user", userId] as const,
	user: (userId: string, limit: number) =>
		["cliques", "user", userId, { limit }] as const,
	feed: (limit: number) => ["cliques", "feed", { limit }] as const,
};

export function useCreateCliqueMutation() {
	const queryClient = useQueryClient();
	return useMutation<Clique, unknown, CreateCliqueVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.POST("/api/v1/cliques", variables)),
		onSuccess: (clique) => {
			if (clique?.id) {
				queryClient.invalidateQueries({
					queryKey: cliqueKeys.detail(clique.id),
				});
			}
			queryClient.invalidateQueries({ queryKey: cliqueKeys.all, exact: false });
		},
	});
}

export function useGetCliqueQuery(cliqueId: string | undefined) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: cliqueKeys.detail(cliqueId ?? ""),
		enabled: Boolean(tokens?.accessToken) && Boolean(cliqueId),
		queryFn: async () => {
			if (!cliqueId) {
				throw new Error("cliqueId is required");
			}

			return ensureData(
				await $api.GET("/api/v1/cliques/{cliqueId}", {
					params: { path: { cliqueId } },
				}),
			);
		},
	});
}

export function useUpdateCliqueMutation() {
	const queryClient = useQueryClient();
	return useMutation<Clique, unknown, UpdateCliqueVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.PATCH("/api/v1/cliques/{cliqueId}", variables)),
		onSuccess: (clique, variables) => {
			const cliqueId = variables.params?.path?.cliqueId ?? clique?.id;
			if (cliqueId) {
				queryClient.invalidateQueries({
					queryKey: cliqueKeys.detail(cliqueId),
				});
			}
			queryClient.invalidateQueries({ queryKey: cliqueKeys.all, exact: false });
		},
	});
}

export function useDeleteCliqueMutation() {
	const queryClient = useQueryClient();
	return useMutation<void, unknown, DeleteCliqueVariables>({
		mutationFn: async (variables) => {
			const result = await $api.DELETE("/api/v1/cliques/{cliqueId}", variables);
			if (result.error) {
				throw result.error;
			}
		},
		onSuccess: (_data, variables) => {
			const cliqueId = variables.params?.path?.cliqueId;
			if (cliqueId) {
				queryClient.invalidateQueries({
					queryKey: cliqueKeys.detail(cliqueId),
				});
			}
			queryClient.invalidateQueries({ queryKey: cliqueKeys.all, exact: false });
		},
	});
}

export function useJoinCliqueMutation() {
	const queryClient = useQueryClient();
	return useMutation<CliqueMember, unknown, JoinCliqueVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.POST("/api/v1/cliques/{cliqueId}/join", variables)),
		onSuccess: (_member, variables) => {
			const cliqueId = variables.params?.path?.cliqueId;
			if (cliqueId) {
				queryClient.invalidateQueries({
					queryKey: cliqueKeys.detail(cliqueId),
				});
				queryClient.invalidateQueries({
					queryKey: cliqueKeys.membersBase(cliqueId),
					exact: false,
				});
				queryClient.invalidateQueries({
					queryKey: cliqueKeys.pendingBase(cliqueId),
					exact: false,
				});
			}
			queryClient.invalidateQueries({ queryKey: cliqueKeys.all, exact: false });
			queryClient.invalidateQueries({
				queryKey: ["cliques", "user"],
				exact: false,
			});
		},
	});
}

export function useLeaveCliqueMutation() {
	const queryClient = useQueryClient();
	return useMutation<Record<string, string>, unknown, LeaveCliqueVariables>({
		mutationFn: async (variables) =>
			ensureData(
				await $api.DELETE("/api/v1/cliques/{cliqueId}/members/me", variables),
			),
		onSuccess: (_data, variables) => {
			const cliqueId = variables.params?.path?.cliqueId;
			if (cliqueId) {
				queryClient.invalidateQueries({
					queryKey: cliqueKeys.detail(cliqueId),
				});
				queryClient.invalidateQueries({
					queryKey: cliqueKeys.membersBase(cliqueId),
					exact: false,
				});
			}
			queryClient.invalidateQueries({ queryKey: cliqueKeys.all, exact: false });
			queryClient.invalidateQueries({
				queryKey: ["cliques", "user"],
				exact: false,
			});
		},
	});
}

export function useListCliqueMembersQuery(
	cliqueId: string | undefined,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<MembersPage>({
		queryKey: cliqueKeys.members(cliqueId ?? "", limit),
		enabled: Boolean(tokens?.accessToken) && Boolean(cliqueId),
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			if (!cliqueId) {
				throw new Error("cliqueId is required");
			}
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/cliques/{cliqueId}/members", {
					params: {
						path: { cliqueId },
						query: { cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	return withCursorHelpers<CliqueMember, MembersPage>(query);
}

export function useListPendingMembersQuery(
	cliqueId: string | undefined,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<MembersPage>({
		queryKey: cliqueKeys.pending(cliqueId ?? "", limit),
		enabled: Boolean(tokens?.accessToken) && Boolean(cliqueId),
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			if (!cliqueId) {
				throw new Error("cliqueId is required");
			}
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/cliques/{cliqueId}/members/pending", {
					params: {
						path: { cliqueId },
						query: { cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	return withCursorHelpers<CliqueMember, MembersPage>(query);
}

export function useApproveMembershipMutation() {
	const queryClient = useQueryClient();
	return useMutation<CliqueMember, unknown, ApproveMemberVariables>({
		mutationFn: async (variables) =>
			ensureData(
				await $api.POST(
					"/api/v1/cliques/{cliqueId}/members/{memberId}/approve",
					variables,
				),
			),
		onSuccess: (_member, variables) => {
			const cliqueId = variables.params?.path?.cliqueId;
			if (!cliqueId) return;
			queryClient.invalidateQueries({
				queryKey: cliqueKeys.membersBase(cliqueId),
				exact: false,
			});
			queryClient.invalidateQueries({
				queryKey: cliqueKeys.pendingBase(cliqueId),
				exact: false,
			});
		},
	});
}

export function useRejectMembershipMutation() {
	const queryClient = useQueryClient();
	return useMutation<Record<string, string>, unknown, RejectMemberVariables>({
		mutationFn: async (variables) =>
			ensureData(
				await $api.POST(
					"/api/v1/cliques/{cliqueId}/members/{memberId}/reject",
					variables,
				),
			),
		onSuccess: (_member, variables) => {
			const cliqueId = variables.params?.path?.cliqueId;
			if (!cliqueId) return;
			queryClient.invalidateQueries({
				queryKey: cliqueKeys.membersBase(cliqueId),
				exact: false,
			});
			queryClient.invalidateQueries({
				queryKey: cliqueKeys.pendingBase(cliqueId),
				exact: false,
			});
		},
	});
}

export function useListUserCliquesQuery(
	userId: string | undefined,
	enabled = true,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<CliquePage>({
		queryKey: cliqueKeys.user(userId ?? "", limit),
		enabled: Boolean(tokens?.accessToken) && Boolean(userId) && enabled,
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			if (!userId) {
				throw new Error("userId is required");
			}
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/cliques/user/{userId}/cliques", {
					params: {
						path: { userId },
						query: { cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	return withCursorHelpers<Clique, CliquePage>(query);
}

export function useCreateInviteMutation() {
	const queryClient = useQueryClient();
	return useMutation<CliqueInvite, unknown, CreateInviteVariables>({
		mutationFn: async (variables) =>
			ensureData(
				await $api.POST("/api/v1/cliques/{cliqueId}/invites", variables),
			),
		onSuccess: (_invite, variables) => {
			const cliqueId = variables.params?.path?.cliqueId;
			if (!cliqueId) return;
			queryClient.invalidateQueries({ queryKey: cliqueKeys.detail(cliqueId) });
		},
	});
}

export function useGetCliqueFeedQuery(limit = 20) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<PostsPage>({
		queryKey: cliqueKeys.feed(limit),
		enabled: Boolean(tokens?.accessToken),
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/cliques/feed", {
					params: {
						query: { cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	return withCursorHelpers<components["schemas"]["Post"], PostsPage>(query);
}

export function useListCliquesQuery(limit = 20) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<CliquePage>({
		queryKey: cliqueKeys.list(limit),
		enabled: Boolean(tokens?.accessToken),
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/cliques", {
					params: {
						query: { cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	return withCursorHelpers<Clique, CliquePage>(query);
}
