import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useMeQuery() {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/users/me", {
		enabled: !!tokens?.accessToken,
		retry: false,
	});
}

export function useUserQuery(userId: string | undefined) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/users/{userId}", {
		params: {
			path: { userId: userId! },
		},
		enabled: !!tokens?.accessToken && !!userId,
		retry: false,
	});
}

export function useFollowMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/users/{userId}/follow", {
		onSuccess: (data, variables) => {
			const userId = variables.params.path.userId;
			// Invalidate user queries to refresh follow status
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

// Note: Unfollow is not implemented in the OpenAPI spec
// export function useUnfollowMutation() { ... }
export function useBlockMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/users/{userId}/follow/block", {
		onSuccess: (data, variables) => {
			const userId = variables.params.path.userId;
			// Invalidate user queries to refresh block status
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useUnblockMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("delete", "/api/v1/users/{userId}/follow/block", {
		onSuccess: (data, variables) => {
			const userId = variables.params.path.userId;
			// Invalidate user queries to refresh block status
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useUpdateUserMutation() {
	const queryClient = useQueryClient();

	return $api.useMutation("patch", "/api/v1/users/me", {
		onSuccess: () => {
			// Invalidate user queries to ensure consistency
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});
}

export function useSearchUsersQuery(params: {
	q?: string;
	occupationId?: string;
	sort?: string;
	cursor?: string;
	limit?: number;
}) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/users", {
		params: {
			query: params,
		},
		enabled: !!tokens?.accessToken,
	});
}

export function useApproveFollowMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/users/{userId}/follow/approve", {
		onSuccess: (data, variables) => {
			const userId = variables.params.path.userId;
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useRejectFollowMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/users/{userId}/follow/reject", {
		onSuccess: (data, variables) => {
			const userId = variables.params.path.userId;
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useRemoveFollowerMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation(
		"delete",
		"/api/v1/users/{userId}/follow/followers/{followerId}",
		{
			onSuccess: (data, variables) => {
				const userId = variables.params.path.userId;
				queryClient.invalidateQueries({ queryKey: ["users", userId] });
				queryClient.invalidateQueries({ queryKey: ["users", "me"] });
			},
		},
	);
}

export function useListFollowersQuery(
	userId: string | undefined,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/users/{userId}/follow/followers", {
		params: {
			path: { userId: userId! },
			query: { cursor, limit },
		},
		enabled: !!tokens?.accessToken && !!userId,
	});
}

export function useListFollowingQuery(
	userId: string | undefined,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/users/{userId}/follow/following", {
		params: {
			path: { userId: userId! },
			query: { cursor, limit },
		},
		enabled: !!tokens?.accessToken && !!userId,
	});
}
