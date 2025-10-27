import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api";

export function useListOccupationsQuery(limit = 50) {
	return $api.useQuery("get", "/api/v1/occupations", {
		params: {
			query: { limit },
		},
	});
}

export function useSearchOccupationsQuery(q: string, limit = 20) {
	return $api.useQuery("get", "/api/v1/occupations/search", {
		params: {
			query: { q, limit },
		},
	});
}

export function useUpdateUserOccupationsMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("put", "/api/v1/occupations/user", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["users", "me"] });
		},
	});
}

export function useCreateOccupationMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/occupations", {
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
	return $api.useMutation("put", "/api/v1/occupations/clique/{cliqueId}", {
		onSuccess: (data, variables) => {
			const cliqueId = variables.params.path.cliqueId;
			queryClient.invalidateQueries({ queryKey: ["cliques", cliqueId] });
		},
	});
}
