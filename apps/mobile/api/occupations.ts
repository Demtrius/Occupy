import { api } from "@/lib/api-client";
import type { Occupation } from "@/types/occupations";

export async function listOccupations(limit = 50): Promise<Occupation[]> {
	const response = await api.get("/api/v1/occupations", {
		params: { limit },
	});
	return response.data as Occupation[];
}

export async function searchOccupations(
	q: string,
	limit = 20,
): Promise<Occupation[]> {
	const response = await api.get("/api/v1/occupations/search", {
		params: { q, limit },
	});
	return response.data as Occupation[];
}

export async function updateUserOccupations(
	occupationIds: string[],
): Promise<{ message: string }> {
	const response = await api.put("/api/v1/occupations/user", occupationIds);
	return response.data as { message: string };
}

export async function updateCliqueOccupations(
	cliqueId: string,
	occupationIds: string[],
	clique_id: string,
): Promise<{ message: string }> {
	const response = await api.put(
		`/api/v1/occupations/clique/${cliqueId}`,
		occupationIds,
		{
			params: { clique_id },
		},
	);
	return response.data as { message: string };
}
