import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as occupations from "@/api/occupations";

export function useListOccupationsQuery(limit = 50) {
	return useQuery({
		queryKey: ["occupations", { limit }],
		queryFn: () => occupations.listOccupations(limit),
	});
}

export function useSearchOccupationsQuery(q: string, limit = 20) {
	return useQuery({
		queryKey: ["occupations", "search", { q, limit }],
		queryFn: () => occupations.searchOccupations(q, limit),
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

export function useCreateOccupationMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: occupations.createOccupation,
		onSuccess: (newOccupation) => {
			// Invalidate all occupation queries to refresh the list
			queryClient.invalidateQueries({
				queryKey: ["occupations"],
				exact: false,
			});
			// Return the new occupation for immediate use
			return newOccupation;
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
