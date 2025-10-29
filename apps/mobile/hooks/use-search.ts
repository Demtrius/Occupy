import { useQuery } from "@tanstack/react-query";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useSearchQuery(q: string, limit = 20) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["search", q, limit],
		enabled: Boolean(tokens?.accessToken) && Boolean(q) && limit > 0,
		queryFn: async () =>
			ensureData(
				await $api.GET("/api/v1/search", {
					params: {
						query: { q, limit },
					},
				}),
			),
	});
}
