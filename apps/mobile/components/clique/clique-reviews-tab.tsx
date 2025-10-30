import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { ActivityIndicator, FlatList, View } from "react-native";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Review } from "@/types";

interface CliqueReviewsTabProps {
	reviews: Review[];
	isLoading: boolean;
	onEndReached: () => void;
	isFetchingMore: boolean;
}

export function CliqueReviewsTab({
	reviews,
	isLoading,
	onEndReached,
	isFetchingMore,
}: CliqueReviewsTabProps) {
	const theme = useTheme<Theme>();

	const renderItem = ({ item }: { item: Review }) => (
		<Card variant="elevated" marginBottom="s">
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					marginBottom: theme.spacing.xs,
				}}
			>
				{Array.from({ length: 5 }).map((_, index) => (
					<Ionicons
						key={`${item.id}-star-${index}`}
						name={index < item.rating ? "star" : "star-outline"}
						size={16}
						color={theme.colors.primary}
						style={{ marginRight: 4 }}
					/>
				))}
			</View>
			{item.comment ? (
				<Text variant="body" color="foreground" marginBottom="s">
					"{item.comment}"
				</Text>
			) : null}
			<Text variant="caption" color="muted-foreground">
				{formatDate(item.createdAt)}
			</Text>
		</Card>
	);

	const ListHeaderComponent = () => (
		<Box marginBottom="m">
			<Text variant="subheader">Reviews</Text>
		</Box>
	);

	const ListFooterComponent = () =>
		isFetchingMore ? (
			<Box alignItems="center" padding="m">
				<ActivityIndicator color={theme.colors.primary} />
			</Box>
		) : null;

	const ListEmptyComponent = () =>
		isLoading ? (
			<Box alignItems="center" padding="xl">
				<ActivityIndicator color={theme.colors.primary} />
			</Box>
		) : (
			<EmptyState message="No reviews yet." />
		);

	return (
		<FlatList
			data={reviews}
			renderItem={renderItem}
			keyExtractor={(item) => item.id}
			ListHeaderComponent={ListHeaderComponent}
			ListFooterComponent={ListFooterComponent}
			ListEmptyComponent={ListEmptyComponent}
			onEndReached={onEndReached}
			onEndReachedThreshold={0.5}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ padding: theme.spacing.m }}
		/>
	);
}

function formatDate(iso: string) {
	const parsed = new Date(iso);
	if (Number.isNaN(parsed.getTime())) return iso;
	return parsed.toLocaleDateString();
}
