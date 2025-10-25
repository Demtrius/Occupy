import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/api/client";

import type { User } from "@/types/user";

export function useUpdateUserMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: Partial<User>) => {
			return apiFetch<User>("/api/v1/users/me", {
				method: "PATCH",
				body: JSON.stringify(data),
			});
		},
		onSuccess: () => {
			// Invalidate user queries to ensure consistency
			queryClient.invalidateQueries({ queryKey: ["user"] });
			queryClient.invalidateQueries({ queryKey: ["me"] });
		},
	});
}
