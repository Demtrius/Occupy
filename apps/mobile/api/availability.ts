import { api } from "@/lib/api-client";
import type {
	Availability,
	AvailabilityCreate,
	AvailabilityUpdate,
} from "@/types/availability";

export async function createAvailability(
	cliqueId: string,
	body: AvailabilityCreate,
): Promise<Availability> {
	const response = await api.post("/api/v1/availability", body, {
		params: { cliqueId },
	});
	return response.data as Availability;
}

export async function listCliqueAvailability(
	cliqueId: string,
): Promise<Availability[]> {
	const response = await api.get(`/api/v1/availability/${cliqueId}`);
	return response.data as Availability[];
}

export async function updateAvailability(
	availabilityId: string,
	body: AvailabilityUpdate,
): Promise<Availability> {
	const response = await api.put(
		`/api/v1/availability/${availabilityId}`,
		body,
	);
	return response.data as Availability;
}

export async function deleteAvailability(
	availabilityId: string,
): Promise<{ message: string }> {
	const response = await api.delete(`/api/v1/availability/${availabilityId}`);
	return response.data as { message: string };
}
