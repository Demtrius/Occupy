import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useLoginMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/auth/login", {
		onSuccess: async ({ accessToken, refreshToken }) => {
			await useAuthStore.getState().setAuth({
				accessToken,
				refreshToken,
			});
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			queryClient.invalidateQueries({ queryKey: ["users"] });
			router.replace("/(tabs)/feed");
		},
	});
}

export function useRegisterMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/auth/register", {
		onSuccess: async ({ accessToken, refreshToken }) => {
			await useAuthStore.getState().setAuth({
				accessToken,
				refreshToken,
			});
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			queryClient.invalidateQueries({ queryKey: ["users"] });
			router.replace("/(tabs)/feed");
		},
	});
}

export function useRefreshMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/auth/refresh", {
		onSuccess: async ({ accessToken, refreshToken }) => {
			await useAuthStore.getState().setAuth({
				accessToken,
				refreshToken,
			});
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});
}

export function useLogoutMutation() {
	const queryClient = useQueryClient();
	const { tokens: _, clear } = useAuthStore.getState();
	return $api.useMutation("post", "/api/v1/auth/logout", {
		onSuccess: () => {
			clear();
			queryClient.clear();
			router.replace("/(auth)/login");
		},
	});
}
