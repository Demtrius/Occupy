import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as services from "@/api/services";
import { useAuthStore } from "@/stores/auth-store";

export function useCreateServiceMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			cliqueId,
			body,
		}: {
			cliqueId: string;
			body: Parameters<typeof services.createService>[1];
		}) => services.createService(cliqueId, body),
		onSuccess: (_, { cliqueId }) => {
			queryClient.invalidateQueries({ queryKey: ["services", cliqueId] });
		},
	});
}

export function useListCliqueServicesQuery(
	cliqueId: string | undefined,
	activeOnly = true,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["services", cliqueId, { activeOnly }],
		queryFn: () => services.listCliqueServices(cliqueId!, activeOnly),
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useUpdateServiceMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			serviceId,
			body,
		}: {
			serviceId: string;
			body: Parameters<typeof services.updateService>[1];
		}) => services.updateService(serviceId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
		},
	});
}

export function useDeleteServiceMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: services.deleteService,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["services"] });
		},
	});
}
