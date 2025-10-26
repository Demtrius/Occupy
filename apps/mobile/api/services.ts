import { api } from "@/lib/api-client";
import type { Service, ServiceCreate, ServiceUpdate } from "@/types/services";

export async function createService(
	cliqueId: string,
	body: ServiceCreate,
): Promise<Service> {
	const response = await api.post("/api/v1/services", body, {
		params: { cliqueId },
	});
	return response.data as Service;
}

export async function listCliqueServices(
	cliqueId: string,
	activeOnly = true,
): Promise<Service[]> {
	const response = await api.get(`/api/v1/services/${cliqueId}`, {
		params: { activeOnly },
	});
	return response.data as Service[];
}

export async function updateService(
	serviceId: string,
	body: ServiceUpdate,
): Promise<Service> {
	const response = await api.put(`/api/v1/services/${serviceId}`, body);
	return response.data as Service;
}

export async function deleteService(
	serviceId: string,
): Promise<{ message: string }> {
	const response = await api.delete(`/api/v1/services/${serviceId}`);
	return response.data as { message: string };
}
