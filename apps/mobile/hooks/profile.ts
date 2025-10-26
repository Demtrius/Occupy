import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { User } from "@/types/user";

export function useUpdateUserMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: Partial<User>) => {
			const response = await api.patch<User>("/api/v1/users/me", data);
			return response.data;
		},
		onSuccess: () => {
			// Invalidate user queries to ensure consistency
			queryClient.invalidateQueries({ queryKey: ["user"] });
			queryClient.invalidateQueries({ queryKey: ["me"] });
		},
	});
}
