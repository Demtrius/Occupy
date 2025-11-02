import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import type { RequestOptions } from "openapi-fetch";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { components, operations } from "@/types/generated";
import { withCursorHelpers } from "./utils";

type Availability = components["schemas"]["Availability"];
type CursorPageAvailability = components["schemas"]["CursorPageAvailability"];

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
	clique: (cliqueId: string, limit: number) =>
		["availability", cliqueId, { limit }] as const,
};

export function useCreateAvailabilityMutation() {
	const queryClient = useQueryClient();
	return useMutation<Availability, unknown, CreateAvailabilityVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.POST("/api/v1/availability", variables)),
		onSuccess: (_data, variables) => {
			const cliqueId = variables.params?.query?.cliqueId;
			queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
			if (cliqueId) {
				queryClient.invalidateQueries({
					queryKey: ["availability", cliqueId],
					exact: false,
				});
			}
		},
	});
}

export function useListCliqueAvailabilityQuery(
	cliqueId: string | undefined,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	const query = useInfiniteQuery<CursorPageAvailability>({
		queryKey: availabilityKeys.clique(cliqueId ?? "", limit),
		enabled: Boolean(tokens?.accessToken) && Boolean(cliqueId),
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) => {
			if (!cliqueId) {
				throw new Error("cliqueId is required");
			}
			const cursor = typeof pageParam === "string" ? pageParam : undefined;
			return ensureData(
				await $api.GET("/api/v1/availability/{cliqueId}", {
					params: {
						path: { cliqueId },
						query: { cursor, limit },
					},
				}),
			);
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	return withCursorHelpers<Availability, CursorPageAvailability>(query);
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
