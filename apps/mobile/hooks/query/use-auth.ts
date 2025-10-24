import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as auth from "@/api/auth";
import * as users from "@/api/users";
import { useAuthStore } from "@/stores/auth-store";

export function useMeQuery() {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["me"],
		queryFn: users.getMe,
		enabled: !!tokens?.accessToken,
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
