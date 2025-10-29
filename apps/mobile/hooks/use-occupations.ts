import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RequestOptions } from "openapi-fetch";
import { $api, ensureData } from "@/lib/api";
import type { components, operations } from "@/types/generated";

type Occupation = components["schemas"]["Occupation"];
type CreateOccupationVariables =
	RequestOptions<operations["OccupationsCreate"]>;
type UpdateUserOccupationsVariables =
	RequestOptions<operations["OccupationsUser"]>;
type UpdateCliqueOccupationsVariables =
	RequestOptions<operations["OccupationsCliqueUpdate"]>;

const occupationKeys = {
	all: ["occupations", "all"] as const,
	search: (query: string, limit: number) =>
		["occupations", "search", query, limit] as const,
};

export function useListOccupationsQuery(limit = 50) {
	return useQuery({
		queryKey: [...occupationKeys.all, { limit }] as const,
		queryFn: async () =>
			ensureData(
				await $api.GET("/api/v1/occupations", {
					params: {
						query: { limit },
					},
				}),
			),
	});
}

export function useSearchOccupationsQuery(q: string, limit = 20) {
	return useQuery({
		queryKey: occupationKeys.search(q, limit),
		enabled: Boolean(q),
		queryFn: async () =>
			ensureData(
				await $api.GET("/api/v1/occupations/search", {
					params: {
						query: { q, limit },
					},
				}),
			),
	});
}

export function useUpdateUserOccupationsMutation() {
	const queryClient = useQueryClient();
	return useMutation<Record<string, string>, unknown, UpdateUserOccupationsVariables>(
		{
			mutationFn: async (variables) =>
				ensureData(await $api.PUT("/api/v1/occupations/user", variables)),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["users", "me"] });
				queryClient.invalidateQueries({ queryKey: occupationKeys.all, exact: false });
			},
		},
	);
}

export function useCreateOccupationMutation() {
	const queryClient = useQueryClient();
	return useMutation<Occupation, unknown, CreateOccupationVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.POST("/api/v1/occupations", variables)),
		onSuccess: (occupation) => {
			queryClient.invalidateQueries({ queryKey: occupationKeys.all, exact: false });
			return occupation;
		},
	});
}

export function useUpdateCliqueOccupationsMutation() {
	const queryClient = useQueryClient();
	return useMutation<Record<string, string>, unknown, UpdateCliqueOccupationsVariables>({
		mutationFn: async (variables) =>
			ensureData(
				await $api.PUT("/api/v1/occupations/clique/{cliqueId}", variables),
			),
		onSuccess: (_data, variables) => {
			const cliqueId = variables.params?.path?.cliqueId;
			if (cliqueId) {
				queryClient.invalidateQueries({ queryKey: ["cliques", "detail", cliqueId] });
			}
		},
	});
}
