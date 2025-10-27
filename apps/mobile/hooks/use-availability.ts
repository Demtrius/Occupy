import { useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useCreateAvailabilityMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/availability", {
		onSuccess: (data, variables) => {
			// Invalidate availability queries
			queryClient.invalidateQueries({ queryKey: ["availability"] });
		},
	});
}

export function useListCliqueAvailabilityQuery(cliqueId: string | undefined) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/availability/{cliqueId}", {
		params: {
			path: { cliqueId: cliqueId! },
		},
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useUpdateAvailabilityMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("put", "/api/v1/availability/{availabilityId}", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["availability"] });
		},
	});
}

export function useDeleteAvailabilityMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("delete", "/api/v1/availability/{availabilityId}", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["availability"] });
		},
	});
}
