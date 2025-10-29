import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RequestOptions } from "openapi-fetch";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { components, operations } from "@/types/generated";

type Service = components["schemas"]["Service"];
type CreateServiceVariables = RequestOptions<operations["ServicesCreate"]>;
type UpdateServiceVariables = RequestOptions<operations["ServicesUpdateById"]>;
type DeleteServiceVariables = RequestOptions<operations["ServicesDeleteById"]>;

const serviceKeys = {
	all: ["services"] as const,
	clique: (cliqueId: string) => ["services", "clique", cliqueId] as const,
	detail: (serviceId: string) => ["services", "detail", serviceId] as const,
};

export function useCreateServiceMutation() {
	const queryClient = useQueryClient();
	return useMutation<Service, unknown, CreateServiceVariables>({
		mutationFn: async (variables: CreateServiceVariables) =>
			ensureData(await $api.POST("/api/v1/services", variables)),
		onSuccess: (service, variables) => {
			const cliqueId =
				variables.params?.query?.cliqueId ?? service?.cliqueId ?? null;
			if (cliqueId) {
				queryClient.invalidateQueries({
					queryKey: serviceKeys.clique(cliqueId),
				});
			}
			queryClient.invalidateQueries({
				queryKey: serviceKeys.all,
				exact: false,
			});
		},
	});
}

export function useListCliqueServicesQuery(
	cliqueId: string | undefined,
	activeOnly = true,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: serviceKeys.clique(cliqueId ?? ""),
		enabled: Boolean(tokens?.accessToken) && Boolean(cliqueId),
		queryFn: async () =>
			ensureData(
				await $api.GET("/api/v1/services/{cliqueId}", {
					params: {
						path: { cliqueId: cliqueId! },
						query: { activeOnly },
					},
				}),
			),
	});
}

export function useUpdateServiceMutation() {
	const queryClient = useQueryClient();
	return useMutation<Service, unknown, UpdateServiceVariables>({
		mutationFn: async (variables: UpdateServiceVariables) =>
			ensureData(await $api.PUT("/api/v1/services/{serviceId}", variables)),
		onSuccess: (service) => {
			if (service?.cliqueId) {
				queryClient.invalidateQueries({
					queryKey: serviceKeys.clique(service.cliqueId),
				});
			}
			if (service?.id) {
				queryClient.invalidateQueries({
					queryKey: serviceKeys.detail(service.id),
				});
			}
			queryClient.invalidateQueries({
				queryKey: serviceKeys.all,
				exact: false,
			});
		},
	});
}

export function useDeleteServiceMutation() {
	const queryClient = useQueryClient();
	return useMutation<Record<string, string>, unknown, DeleteServiceVariables>({
		mutationFn: async (variables: DeleteServiceVariables) =>
			ensureData(await $api.DELETE("/api/v1/services/{serviceId}", variables)),
		onSuccess: (_data, variables) => {
			const serviceId = variables.params?.path?.serviceId;
			if (serviceId) {
				queryClient.invalidateQueries({
					queryKey: serviceKeys.detail(serviceId),
				});
			}
			queryClient.invalidateQueries({
				queryKey: serviceKeys.all,
				exact: false,
			});
		},
	});
}
