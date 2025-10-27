import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useListAvailableSlotsQuery(
	cliqueId: string | undefined,
	serviceId: string,
	from: string,
	to: string,
) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/cliques/{cliqueId}/slots", {
		params: {
			path: { cliqueId: cliqueId! },
			query: { serviceId, from, to },
		},
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}
