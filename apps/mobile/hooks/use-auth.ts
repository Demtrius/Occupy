import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as auth from "@/api/auth";

export function useLoginMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: auth.login,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			queryClient.invalidateQueries({ queryKey: ["users"] });
			router.replace("/(tabs)/feed");
		},
	});
}

export function useRegisterMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: auth.register,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			queryClient.invalidateQueries({ queryKey: ["users"] });
			router.replace("/(tabs)/feed");
		},
	});
}

export function useRefreshMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: auth.refresh,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			queryClient.invalidateQueries({ queryKey: ["users"] });
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
