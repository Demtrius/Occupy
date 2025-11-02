import { useTheme } from "@shopify/restyle";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";
import { PostCard } from "@/components/cards/post-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Post } from "@/types";
import { CreatePostModal } from "./create-post-modal";

interface CliquePostsTabProps {
	cliqueId: string;
	posts: Post[];
	isMember: boolean;
	onPostCreated?: (post: Post) => void;
	isLoading: boolean;
	onEndReached: () => void;
	isFetchingMore: boolean;
}

export function CliquePostsTab({
	cliqueId,
	posts,
	isMember,
	onPostCreated,
	isLoading,
	onEndReached,
	isFetchingMore,
}: CliquePostsTabProps) {
	const theme = useTheme<Theme>();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleOpenModal = useCallback(() => {
		setIsModalOpen(true);
	}, []);

	const handleCloseModal = useCallback(() => {
		setIsModalOpen(false);
	}, []);

	const handlePostCreated = useCallback(
		(post: Post) => {
			onPostCreated?.(post);
		},
		[onPostCreated],
	);

	const renderItem = ({ item }: { item: Post }) => <PostCard post={item} />;

	const ListHeaderComponent = () => (
		<Box marginBottom="m">
			{isMember ? (
				<Button
					variant="primary"
					onPress={handleOpenModal}
					disabled={!cliqueId}
				>
					Create Post
				</Button>
			) : (
				<Text variant="caption" color="muted-foreground">
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
		<>
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
			{isMember ? (
				<CreatePostModal
					visible={isModalOpen}
					onClose={handleCloseModal}
					cliqueId={cliqueId}
					onCreated={handlePostCreated}
				/>
			) : null}
		</>
	);
}
