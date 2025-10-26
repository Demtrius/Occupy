import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as availability from "@/api/availability";
import { useAuthStore } from "@/stores/auth-store";

export function useCreateAvailabilityMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			cliqueId,
			body,
		}: {
			cliqueId: string;
			body: Parameters<typeof availability.createAvailability>[1];
		}) => availability.createAvailability(cliqueId, body),
		onSuccess: (_, { cliqueId }) => {
			queryClient.invalidateQueries({ queryKey: ["availability", cliqueId] });
		},
	});
}

export function useListCliqueAvailabilityQuery(cliqueId: string | undefined) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["availability", cliqueId],
		queryFn: () => availability.listCliqueAvailability(cliqueId!),
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useUpdateAvailabilityMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			availabilityId,
			body,
		}: {
			availabilityId: string;
			body: Parameters<typeof availability.updateAvailability>[1];
		}) => availability.updateAvailability(availabilityId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["availability"] });
		},
	});
}

export function useDeleteAvailabilityMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: availability.deleteAvailability,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["availability"] });
		},
	});
}
