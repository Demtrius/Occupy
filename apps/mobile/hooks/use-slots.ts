import { useQuery } from "@tanstack/react-query";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useListAvailableSlotsQuery(
	cliqueId: string | undefined,
	serviceId: string,
	from: string,
	to: string,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["slots", cliqueId ?? "", serviceId, from, to],
		enabled:
			Boolean(tokens?.accessToken) &&
			Boolean(cliqueId) &&
			Boolean(serviceId) &&
			Boolean(from) &&
			Boolean(to),
		queryFn: async () => {
			if (!cliqueId) {
				throw new Error("cliqueId is required");
			}
			return ensureData(
				await $api.GET("/api/v1/cliques/{cliqueId}/slots", {
					params: {
						path: { cliqueId },
						query: { serviceId, from, to },
					},
				}),
			);
		},
	});
}
