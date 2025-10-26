import { useQuery } from "@tanstack/react-query";
import * as posts from "@/api/posts";
import { useAuthStore } from "@/stores/auth-store";

type FeedFilter = "all" | "followings" | "cliques";

interface UseFeedPostsOptions {
	filter?: FeedFilter;
	enabled?: boolean;
}

export function useFeedPosts({
	filter = "all",
	enabled = true,
}: UseFeedPostsOptions = {}) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["feed-posts", filter],
		queryFn: async () => {
			const filterParam = filter === "all" ? undefined : filter;
			return posts.listFeedPosts(filterParam);
		},
		enabled: !!tokens?.accessToken && enabled,
	});
}
