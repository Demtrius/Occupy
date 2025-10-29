import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RequestOptions } from "openapi-fetch";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { operations } from "@/types/generated";

type CreateAvailabilityVariables = RequestOptions<
	operations["AvailabilityCreate"]
>;
type UpdateAvailabilityVariables = RequestOptions<
	operations["AvailabilityUpdateById"]
>;
type DeleteAvailabilityVariables = RequestOptions<
	operations["AvailabilityDeleteById"]
>;

const availabilityKeys = {
	all: ["availability"] as const,
	clique: (cliqueId: string) => ["availability", cliqueId] as const,
};

export function useCreateAvailabilityMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: CreateAvailabilityVariables) =>
			ensureData(await $api.POST("/api/v1/availability", variables)),
		onSuccess: () => {
			// Invalidate availability queries
			queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
		},
	});
}

export function useListCliqueAvailabilityQuery(cliqueId: string | undefined) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: availabilityKeys.clique(cliqueId ?? ""),
		enabled: Boolean(tokens?.accessToken) && Boolean(cliqueId),
		queryFn: async () => {
			if (!cliqueId) {
				throw new Error("cliqueId is required");
			}
			return ensureData(
				await $api.GET("/api/v1/availability/{cliqueId}", {
					params: {
						path: { cliqueId },
					},
				}),
			);
		},
	});
}

export function useUpdateAvailabilityMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: UpdateAvailabilityVariables) =>
			ensureData(
				await $api.PUT("/api/v1/availability/{availabilityId}", variables),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
		},
	});
}

export function useDeleteAvailabilityMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (variables: DeleteAvailabilityVariables) =>
			ensureData(
				await $api.DELETE("/api/v1/availability/{availabilityId}", variables),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
		},
	});
}
