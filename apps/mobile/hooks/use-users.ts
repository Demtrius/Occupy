import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as users from "@/api/users";
import { useAuthStore } from "@/stores/auth-store";

export function useMeQuery() {
	const { tokens } = useAuthStore();
	const query = useQuery({
		queryKey: ["users", "me"],
		queryFn: users.getMe,
		enabled: !!tokens?.accessToken,
		retry: false,
	});

	return query;
}

export function useUserQuery(userId: string | undefined) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["users", userId],
		queryFn: () => users.getUser(userId!),
		enabled: !!tokens?.accessToken && !!userId,
		retry: false,
	});
}

export function useFollowMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId }: { userId: string }) => users.followUser(userId),
		onSuccess: (_, { userId }) => {
			// Invalidate user queries to refresh follow status
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useUnfollowMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId }: { userId: string }) => users.unfollowUser(userId),
		onSuccess: (_, { userId }) => {
			// Invalidate user queries to refresh follow status
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useBlockMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId }: { userId: string }) => users.blockUser(userId),
		onSuccess: (_, { userId }) => {
			// Invalidate user queries to refresh block status
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useUnblockMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId }: { userId: string }) => users.unblockUser(userId),
		onSuccess: (_, { userId }) => {
			// Invalidate user queries to refresh block status
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useUpdateUserMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: users.updateMe,
		onSuccess: () => {
			// Invalidate user queries to ensure consistency
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});
}

export function useSearchUsersQuery(
	params: Parameters<typeof users.searchUsers>[0],
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["users", "search", params],
		queryFn: () => users.searchUsers(params),
		enabled: !!tokens?.accessToken,
	});
}

export function useApproveFollowMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId }: { userId: string }) => users.approveFollow(userId),
		onSuccess: (_, { userId }) => {
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useRejectFollowMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId }: { userId: string }) => users.rejectFollow(userId),
		onSuccess: (_, { userId }) => {
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useRemoveFollowerMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			userId,
			followerId,
		}: {
			userId: string;
			followerId: string;
		}) => users.removeFollower(userId, followerId),
		onSuccess: (_, { userId }) => {
			queryClient.invalidateQueries({ queryKey: ["users", userId] });
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useListFollowersQuery(
	userId: string | undefined,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["users", userId, "followers", { cursor, limit }],
		queryFn: () => users.listFollowers(userId!, cursor, limit),
		enabled: !!tokens?.accessToken && !!userId,
	});
}

export function useListFollowingQuery(
	userId: string | undefined,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["users", userId, "following", { cursor, limit }],
		queryFn: () => users.listFollowing(userId!, cursor, limit),
		enabled: !!tokens?.accessToken && !!userId,
	});
}
