import { useQuery } from "@tanstack/react-query";
import * as search from "@/api/search";
import { useAuthStore } from "@/stores/auth-store";

export function useSearchQuery(q: string, limit = 20) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["search", { q, limit }],
		queryFn: () => search.search(q, limit),
		enabled: !!tokens?.accessToken && !!q && limit > 0,
	});
}
