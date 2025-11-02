import { useTheme } from "@shopify/restyle";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList } from "react-native";
import { PostCard } from "@/components/cards/post-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import { useDeletePostMutation } from "@/hooks/use-posts";
import { getErrorMessage } from "@/lib/error-utils";
import { presentOverflowMenu } from "@/lib/overflow-menu";
import { showToast } from "@/stores/toast-store";
import type { Post } from "@/types";
import { CreatePostModal } from "./create-post-modal";

interface CliquePostsTabProps {
	cliqueId: string;
	posts: Post[];
	isMember: boolean;
	currentUserId?: string | null;
	onPostCreated?: (post: Post) => void;
	onPostUpdated?: (post: Post) => void;
	onPostDeleted?: (postId: string) => void;
	isLoading: boolean;
	onEndReached: () => void;
	isFetchingMore: boolean;
}

export function CliquePostsTab({
	cliqueId,
	posts,
	isMember,
	currentUserId,
	onPostCreated,
	onPostUpdated,
	onPostDeleted,
	isLoading,
	onEndReached,
	isFetchingMore,
}: CliquePostsTabProps) {
	const theme = useTheme<Theme>();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [editingPost, setEditingPost] = useState<Post | null>(null);
	const deletePostMutation = useDeletePostMutation();

	const handleOpenModal = useCallback(() => {
		setModalMode("create");
		setEditingPost(null);
		setIsModalOpen(true);
	}, []);

	const handleCloseModal = useCallback(() => {
		setIsModalOpen(false);
		setEditingPost(null);
	}, []);

	const handlePostCreated = useCallback(
		(post: Post) => {
			onPostCreated?.(post);
		},
		[onPostCreated],
	);

	const handlePostUpdated = useCallback(
		(post: Post) => {
			onPostUpdated?.(post);
		},
		[onPostUpdated],
	);

	const confirmDelete = useCallback(
		(post: Post) => {
			Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await deletePostMutation.mutateAsync({
								params: { path: { postId: post.id } },
							});
							showToast({
								type: "success",
								message: "Post deleted",
							});
							onPostDeleted?.(post.id);
						} catch (error: unknown) {
							showToast({
								type: "error",
								message: getErrorMessage(error, "Failed to delete post"),
							});
						}
					},
				},
			]);
		},
		[deletePostMutation, onPostDeleted],
	);

	const handleMenuPress = useCallback(
		(postItem: Post) => {
			presentOverflowMenu([
				{
					label: "Edit",
					onPress: () => {
						setModalMode("edit");
						setEditingPost(postItem);
						setIsModalOpen(true);
					},
				},
				{
					label: "Delete",
					destructive: true,
					onPress: () => confirmDelete(postItem),
				},
			]);
		},
		[confirmDelete],
	);

	const renderItem = useCallback(
		({ item }: { item: Post }) => (
			<PostCard
				post={item}
				canEdit={item.authorUserId === currentUserId}
				onMenuPress={() => handleMenuPress(item)}
			/>
		),
		[currentUserId, handleMenuPress],
	);

	const keyExtractor = useCallback((item: Post) => item.id, []);

	const listHeader = useMemo(
		() => (
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
		),
		[cliqueId, handleOpenModal, isMember],
	);

	const listFooter = useMemo(() => {
		if (!isFetchingMore) return null;
		return (
			<Box alignItems="center" padding="m">
				<ActivityIndicator color={theme.colors.primary} />
			</Box>
		);
	}, [isFetchingMore, theme.colors.primary]);

	const listEmpty = useMemo(() => {
		if (isLoading) {
			return (
				<Box alignItems="center" padding="xl">
					<ActivityIndicator color={theme.colors.primary} />
				</Box>
			);
		}
		return <EmptyState message="No posts yet." />;
	}, [isLoading, theme.colors.primary]);

	return (
		<>
			<FlatList
				data={posts}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				ListHeaderComponent={listHeader}
				ListFooterComponent={listFooter}
				ListEmptyComponent={listEmpty}
				onEndReached={onEndReached}
				onEndReachedThreshold={0.5}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ padding: theme.spacing.m }}
			/>
			{isMember ? (
				<CreatePostModal
					visible={isModalOpen}
					cliqueId={cliqueId}
					mode={modalMode}
					post={editingPost}
					onClose={handleCloseModal}
					onCreated={handlePostCreated}
					onUpdated={handlePostUpdated}
				/>
			) : null}
		</>
	);
}
