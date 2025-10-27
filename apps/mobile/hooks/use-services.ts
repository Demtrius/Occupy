import { useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useCreateServiceMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/services", {
		onSuccess: (data, variables) => {
			// Invalidate services for the clique
			queryClient.invalidateQueries({ queryKey: ["services"] });
		},
	});
}

export function useListCliqueServicesQuery(
	cliqueId: string | undefined,
	activeOnly = true,
) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/services/{cliqueId}", {
		params: {
			path: { cliqueId: cliqueId! },
			query: { activeOnly },
		},
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useUpdateServiceMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("put", "/api/v1/services/{serviceId}", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
		},
	});
}

export function useDeleteServiceMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("delete", "/api/v1/services/{serviceId}", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
		},
	});
}
