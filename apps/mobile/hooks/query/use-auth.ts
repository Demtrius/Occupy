import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";
import * as auth from "@/api/auth";
import * as users from "@/api/users";
import { useAuthStore } from "@/stores/auth-store";

export function useMeQuery() {
	const { tokens } = useAuthStore();
	const query = useQuery({
		queryKey: ["me"],
		queryFn: users.getMe,
		enabled: !!tokens?.accessToken,
		retry: false,
	});

	return query;
}

export function useUserQuery(userId: string | undefined) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["user", userId],
		queryFn: () => users.getUser(userId!),
		enabled: !!tokens?.accessToken && !!userId,
		retry: false,
	});
}

export function useLoginMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: auth.login,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["me"] });
			router.replace("/(tabs)/feed");
		},
	});
}

export function useRegisterMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: auth.register,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["me"] });
			router.replace("/(tabs)/feed");
		},
	});
}

export function useFollowMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId }: { userId: string }) => users.followUser(userId),
		onSuccess: (_, { userId }) => {
			// Invalidate user queries to refresh follow status
			queryClient.invalidateQueries({ queryKey: ["user", userId] });
			queryClient.invalidateQueries({ queryKey: ["me"] });
		},
	});
}

export function useUnfollowMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId }: { userId: string }) => users.unfollowUser(userId),
		onSuccess: (_, { userId }) => {
			// Invalidate user queries to refresh follow status
			queryClient.invalidateQueries({ queryKey: ["user", userId] });
			queryClient.invalidateQueries({ queryKey: ["me"] });
		},
	});
}

export function useBlockMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId }: { userId: string }) => users.blockUser(userId),
		onSuccess: (_, { userId }) => {
			// Invalidate user queries to refresh block status
			queryClient.invalidateQueries({ queryKey: ["user", userId] });
			queryClient.invalidateQueries({ queryKey: ["me"] });
		},
	});
}

export function useUnblockMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId }: { userId: string }) => users.unblockUser(userId),
		onSuccess: (_, { userId }) => {
			// Invalidate user queries to refresh block status
			queryClient.invalidateQueries({ queryKey: ["user", userId] });
			queryClient.invalidateQueries({ queryKey: ["me"] });
		},
	});
}

export function useUserPostsQuery(userId: string | undefined, enabled = true) {
	return useQuery({
		queryKey: ["user-posts", userId],
		queryFn: () => users.getUserPosts(userId!),
		enabled: enabled && !!userId,
	});
}

export function useUserCliquesQuery(
	userId: string | undefined,
	enabled = true,
) {
	return useQuery({
		queryKey: ["user-cliques", userId],
		queryFn: () => users.getUserCliques(userId!),
		enabled: enabled && !!userId,
	});
}

export function useUserBookingsQuery(enabled = true) {
	return useQuery({
		queryKey: ["user-bookings"],
		queryFn: () => users.getUserBookings(),
		enabled,
	});
}

export function useCliqueReviewsQuery(
	cliqueId: string | undefined,
	enabled = true,
) {
	return useQuery({
		queryKey: ["clique-reviews", cliqueId],
		queryFn: () => users.getCliqueReviews(cliqueId!),
		enabled: enabled && !!cliqueId,
	});
}

export function useLogoutMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: auth.logout,
		onSuccess: () => {
			queryClient.clear();
			router.replace("/(auth)/login");
		},
	});
}
