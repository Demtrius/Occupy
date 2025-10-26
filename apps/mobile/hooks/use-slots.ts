import { useQuery } from "@tanstack/react-query";
import * as slots from "@/api/slots";
import { useAuthStore } from "@/stores/auth-store";

export function useListAvailableSlotsQuery(
	cliqueId: string | undefined,
	serviceId: string,
	from: string,
	to: string,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["slots", cliqueId, serviceId, { from, to }],
		queryFn: () => slots.listAvailableSlots(cliqueId!, serviceId, from, to),
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}
