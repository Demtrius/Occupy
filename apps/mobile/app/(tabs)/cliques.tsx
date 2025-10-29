import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { CliqueCard } from "@/components/cards/clique-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Box } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { TabsHeader } from "@/components/ui/tabs-header";
import { useMeQuery } from "@/hooks";
import {
	useListCliquesQuery,
	useListUserCliquesQuery,
} from "@/hooks/use-cliques";

type CliquesFilter = "all" | "my";

export default function Page() {
	const [filter, setFilter] = useState<CliquesFilter>("all");
	const { data: currentUser } = useMeQuery();

	const allCliquesQuery = useListCliquesQuery();
	const myCliquesQuery = useListUserCliquesQuery(
		currentUser?.id,
		filter === "my",
	);

	const isLoading =
		filter === "all" ? allCliquesQuery.isLoading : myCliquesQuery.isLoading;
	const isRefetching =
		filter === "all"
			? allCliquesQuery.isRefetching
			: myCliquesQuery.isRefetching;
	const refetch =
		filter === "all" ? allCliquesQuery.refetch : myCliquesQuery.refetch;

	const cliques =
		filter === "all" ? allCliquesQuery.items : myCliquesQuery.items;

	const onRefresh = () => {
		refetch();
	};

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
			<ScrollView
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
				}
			>
				<Box padding="s">
					{/* Cliques List */}
					{cliques.length === 0 ? (
						<EmptyState
							message={
								filter === "all"
									? "No cliques available"
									: "You are not a member of any cliques yet"
							}
						/>
					) : (
						cliques.map((clique) => (
							<CliqueCard key={clique.id} clique={clique} />
						))
					)}
				</Box>
			</ScrollView>
		</Screen>
	);
}
