import { useQuery } from "@tanstack/react-query";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useSearchQuery(q: string, limit = 20) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/search", {
		params: {
			query: { q, limit },
		},
		enabled: !!tokens?.accessToken && !!q && limit > 0,
	});
}
