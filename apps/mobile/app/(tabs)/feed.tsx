import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";
import { useTheme } from "@shopify/restyle";
import { PostCard } from "@/components/cards/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Box } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { TabsHeader } from "@/components/ui/tabs-header";
import { useFeedPosts } from "@/hooks";
import type { Theme } from "@/config/theme";
import type { Post } from "@/types";

type FeedFilter = "all" | "followings" | "cliques";

export default function Page() {
	const theme = useTheme<Theme>();
	const [filter, setFilter] = useState<FeedFilter>("all");
	const feedQuery = useFeedPosts({ filter });
	const {
		items: posts,
		refetch,
		isRefetching,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = feedQuery;

	const tabs = [
		{ key: "all" as const, label: "All" },
		{ key: "followings" as const, label: "Followings" },
		{ key: "cliques" as const, label: "Cliques" },
	];

	const onRefresh = useCallback(() => {
		refetch();
	}, [refetch]);

	const handleLoadMore = useCallback(() => {
		if (!hasNextPage || isFetchingNextPage) {
			return;
		}
		fetchNextPage();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	const renderItem = useCallback(
		({ item }: { item: Post }) => <PostCard post={item} />,
		[],
	);

	const keyExtractor = useCallback((item: Post) => item.id, []);

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<Screen>
			<TabsHeader tabs={tabs} activeTab={filter} onTabChange={setFilter} />
			<FlatList
				data={posts}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.5}
				refreshing={isRefetching}
				onRefresh={onRefresh}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					padding: theme.spacing.s,
					flexGrow: posts.length === 0 ? 1 : undefined,
				}}
				ListEmptyComponent={
					<Box flex={1} justifyContent="center" paddingVertical="l">
						<EmptyState message="No posts to show" />
					</Box>
				}
				ListFooterComponent={
					isFetchingNextPage ? (
						<Box paddingVertical="m" alignItems="center">
							<ActivityIndicator />
						</Box>
					) : null
				}
			/>
		</Screen>
	);
}
