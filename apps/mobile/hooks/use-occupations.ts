import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as occupations from "@/api/occupations";
import { useAuthStore } from "@/stores/auth-store";

export function useListOccupationsQuery(limit = 50) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["occupations", { limit }],
		queryFn: () => occupations.listOccupations(limit),
		enabled: !!tokens?.accessToken,
	});
}

export function useSearchOccupationsQuery(q: string, limit = 20) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["occupations", "search", { q, limit }],
		queryFn: () => occupations.searchOccupations(q, limit),
		enabled: !!tokens?.accessToken,
	});
}

export function useUpdateUserOccupationsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: occupations.updateUserOccupations,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useUpdateCliqueOccupationsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			cliqueId,
			occupationIds,
			clique_id,
		}: {
			cliqueId: string;
			occupationIds: string[];
			clique_id: string;
		}) =>
			occupations.updateCliqueOccupations(cliqueId, occupationIds, clique_id),
		onSuccess: (_, { cliqueId }) => {
			queryClient.invalidateQueries({ queryKey: ["cliques", cliqueId] });
		},
	});
}
