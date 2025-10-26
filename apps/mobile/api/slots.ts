import { api } from "@/lib/api-client";
import type { Slot } from "@/types/slots";

export async function listAvailableSlots(
	cliqueId: string,
	serviceId: string,
	from: string,
	to: string,
): Promise<{ slots: Slot[] }> {
	const response = await api.get(`/api/v1/cliques/${cliqueId}/slots`, {
		params: { serviceId, from, to },
	});
	return response.data as { slots: Slot[] };
}
