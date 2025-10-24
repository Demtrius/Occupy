import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login, me, register } from "@/api/auth";
import { useAuthStore } from "@/state/auth.store";

export function useMe() {
	const tokens = useAuthStore((s) => s.tokens);
	return useQuery({
		queryKey: ["me"],
		queryFn: me,
		enabled: !!tokens?.accessToken,
	});
}

export function useLogin() {
	const setAuth = useAuthStore((s) => s.setAuth);
	const qc = useQueryClient();
	return useMutation({
		mutationFn: login,
		onSuccess: async (data) => {
			await setAuth({
				user: data.user,
				tokens: {
					accessToken: data.accessToken,
					refreshToken: data.refreshToken,
				},
			});
			qc.invalidateQueries({ queryKey: ["me"] });
		},
	});
}

export function useRegister() {
	const setAuth = useAuthStore((s) => s.setAuth);
	const qc = useQueryClient();
	return useMutation({
		mutationFn: register,
		onSuccess: async (data) => {
			await setAuth({
				user: data.user,
				tokens: {
					accessToken: data.accessToken,
					refreshToken: data.refreshToken,
				},
			});
			qc.invalidateQueries({ queryKey: ["me"] });
		},
	});
}
