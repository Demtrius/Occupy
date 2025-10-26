import { api } from "@/lib/api-client";
import type { SearchResult } from "@/types/search";

export async function search(q: string, limit = 20): Promise<SearchResult> {
	const response = await api.get("/api/v1/search", {
		params: { q, limit },
	});
	return response.data as SearchResult;
}
