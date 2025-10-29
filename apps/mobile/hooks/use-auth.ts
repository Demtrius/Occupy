import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import type { RequestOptions } from "openapi-fetch";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { operations } from "@/types/generated";

type LoginVariables = RequestOptions<operations["AuthLogin"]>;
type RegisterVariables = RequestOptions<operations["AuthRegister"]>;
type RefreshVariables = RequestOptions<operations["AuthRefresh"]>;
type LogoutVariables = RequestOptions<operations["AuthLogout"]>;

export function useLoginMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: LoginVariables) =>
			ensureData(await $api.POST("/api/v1/auth/login", variables)),
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
	return useMutation({
		mutationFn: async (variables: RegisterVariables) =>
			ensureData(await $api.POST("/api/v1/auth/register", variables)),
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
	return useMutation({
		mutationFn: async (variables: RefreshVariables) =>
			ensureData(await $api.POST("/api/v1/auth/refresh", variables)),
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
	return useMutation({
		mutationFn: async (variables?: LogoutVariables) => {
			const fallbackToken = useAuthStore.getState().tokens?.refreshToken;
			const body =
				variables?.body ??
				(fallbackToken ? { refreshToken: fallbackToken } : undefined);
			if (!body?.refreshToken) {
				// Nothing to revoke; mimic server response for consistency.
				return { message: "No active session" };
			}
			return ensureData(
				await $api.POST("/api/v1/auth/logout", {
					...variables,
					body,
				}),
			);
		},
		onSuccess: () => {
			clear();
			queryClient.clear();
			router.replace("/(auth)/login");
		},
	});
}
