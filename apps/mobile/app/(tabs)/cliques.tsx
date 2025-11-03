import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";
import { CliqueCard } from "@/components/cards/clique-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Box } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { TabsHeader } from "@/components/ui/tabs-header";
import type { Theme } from "@/config/theme";
import { useMeQuery } from "@/hooks";
import {
	useListCliquesQuery,
	useListUserCliquesQuery,
} from "@/hooks/use-cliques";
import type { Clique } from "@/types";

type CliquesFilter = "all" | "my";

export default function Page() {
	const theme = useTheme<Theme>();
	const [filter, setFilter] = useState<CliquesFilter>("all");
	const router = useRouter();
	const { data: currentUser } = useMeQuery();
	const currentUserId = currentUser?.id;

	const allCliquesQuery = useListCliquesQuery();
	const myCliquesQuery = useListUserCliquesQuery(
		currentUser?.id,
		filter === "my",
	);

	const activeQuery = filter === "all" ? allCliquesQuery : myCliquesQuery;
	const {
		items: cliques,
		isLoading,
		isRefetching,
		refetch,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = activeQuery;

	const onRefresh = useCallback(() => {
		refetch();
	}, [refetch]);

	const handleLoadMore = useCallback(() => {
		if (!hasNextPage || isFetchingNextPage) {
			return;
		}
		fetchNextPage();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	const sortedCliques = useMemo(() => {
		if (filter !== "my") {
			return cliques;
		}
		if (!currentUserId) {
			return cliques;
		}
		return [...cliques].sort((a, b) => {
			const aOwned = a.ownerUserId === currentUserId;
			const bOwned = b.ownerUserId === currentUserId;
			if (aOwned === bOwned) return 0;
			return aOwned ? -1 : 1;
		});
	}, [cliques, currentUserId, filter]);

	const renderItem = useCallback(
		({ item }: { item: Clique }) => (
			<CliqueCard
				clique={item}
				isOwned={item.ownerUserId === currentUserId}
				onPress={() =>
					router.push({ pathname: "/cliques/[id]", params: { id: item.id } })
				}
			/>
		),
		[currentUserId, router],
	);

	const keyExtractor = useCallback((item: Clique) => item.id, []);

	const listEmptyComponent = useMemo(
		() => (
			<Box flex={1} justifyContent="center" paddingVertical="l">
				<EmptyState
					message={
						filter === "all"
							? "No cliques available"
							: "You are not a member of any cliques yet"
					}
				/>
			</Box>
		),
		[filter],
	);

	const listFooterComponent = useMemo(
		() =>
			isFetchingNextPage ? (
				<Box paddingVertical="m" alignItems="center">
					<ActivityIndicator />
				</Box>
			) : null,
		[isFetchingNextPage],
	);

	const tabs = [
		{ key: "all" as const, label: "All" },
		{ key: "my" as const, label: "My Cliques" },
	];

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<Screen>
			<TabsHeader tabs={tabs} activeTab={filter} onTabChange={setFilter} />
			<FlatList
				data={sortedCliques}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.5}
				refreshing={isRefetching}
				onRefresh={onRefresh}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					padding: theme.spacing.s,
					flexGrow: sortedCliques.length === 0 ? 1 : undefined,
				}}
				ListEmptyComponent={listEmptyComponent}
				ListFooterComponent={listFooterComponent}
			/>
		</Screen>
	);
}
