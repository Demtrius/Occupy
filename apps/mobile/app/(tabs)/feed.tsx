import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { PostCard } from "@/components/cards/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Box } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { TabsHeader } from "@/components/ui/tabs-header";
import { useFeedPosts } from "@/hooks";

type FeedFilter = "all" | "followings" | "cliques";

export default function Page() {
	const [filter, setFilter] = useState<FeedFilter>("all");
	const { data, refetch, isLoading, isRefetching } = useFeedPosts({ filter });

	const posts = data?.items ?? [];

	const onRefresh = () => {
		refetch();
	};

	const tabs = [
		{ key: "all" as const, label: "All" },
		{ key: "followings" as const, label: "Followings" },
		{ key: "cliques" as const, label: "Cliques" },
	];

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<Screen>
			<TabsHeader tabs={tabs} activeTab={filter} onTabChange={setFilter} />
			<ScrollView
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
				}
			>
				<Box padding="s">
					{/* Posts List */}
					{posts.length === 0 ? (
						<EmptyState message="No posts to show" />
					) : (
						posts.map((post) => <PostCard key={post.id} post={post} />)
					)}
				</Box>
			</ScrollView>
		</Screen>
	);
}
