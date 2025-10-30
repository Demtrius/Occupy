import { useTheme } from "@shopify/restyle";
import { ActivityIndicator, FlatList } from "react-native";
import { PostCard } from "@/components/cards/post-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Post } from "@/types";

interface CliquePostsTabProps {
	posts: Post[];
	isMember: boolean;
	onCreatePost?: () => void;
	isLoading: boolean;
	onEndReached: () => void;
	isFetchingMore: boolean;
}

export function CliquePostsTab({
	posts,
	isMember,
	onCreatePost,
	isLoading,
	onEndReached,
	isFetchingMore,
}: CliquePostsTabProps) {
	const theme = useTheme<Theme>();

	const renderItem = ({ item }: { item: Post }) => <PostCard post={item} />;

	const ListHeaderComponent = () => (
		<Box marginBottom="m">
			{isMember ? (
				<Button variant="primary" onPress={onCreatePost}>
					Create Post
				</Button>
			) : (
				<Text variant="caption" color="muted-foreground" marginBottom="m">
					Join this clique to share updates.
				</Text>
			)}
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
			<EmptyState message="No posts yet." />
		);

	return (
		<FlatList
			data={posts}
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
