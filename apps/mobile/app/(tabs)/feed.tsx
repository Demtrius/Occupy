import { useTheme } from "@shopify/restyle";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList } from "react-native";
import { PostCard } from "@/components/cards/post-card";
import { CreatePostModal } from "@/components/clique/create-post-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Box } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { TabsHeader } from "@/components/ui/tabs-header";
import type { Theme } from "@/config/theme";
import { useDeletePostMutation, useFeedPosts, useMeQuery } from "@/hooks";
import { getErrorMessage } from "@/lib/error-utils";
import { presentOverflowMenu } from "@/lib/overflow-menu";
import { showToast } from "@/stores/toast-store";
import type { Post } from "@/types";

type FeedFilter = "all" | "followings" | "cliques";

export default function Page() {
	const theme = useTheme<Theme>();
	const [filter, setFilter] = useState<FeedFilter>("all");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [editingPost, setEditingPost] = useState<Post | null>(null);
	const feedQuery = useFeedPosts({ filter });
	const meQuery = useMeQuery();
	const deletePostMutation = useDeletePostMutation();
	const {
		items: posts,
		refetch,
		isRefetching,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = feedQuery;
	const currentUserId = meQuery.data?.id;

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
		[deletePostMutation],
	);

	const handleMenuPress = useCallback(
		(post: Post) => {
			presentOverflowMenu([
				{
					label: "Edit",
					onPress: () => {
						setModalMode("edit");
						setEditingPost(post);
						setIsModalOpen(true);
					},
				},
				{
					label: "Delete",
					destructive: true,
					onPress: () => confirmDelete(post),
				},
			]);
		},
		[confirmDelete],
	);

	const handleCloseModal = useCallback(() => {
		setIsModalOpen(false);
		setEditingPost(null);
	}, []);

	const handlePostUpdated = useCallback(
		(_post: Post) => {
			showToast({
				type: "success",
				message: "Post updated",
			});
			feedQuery.refetch();
		},
		[feedQuery],
	);

	const renderItem = useCallback(
		({ item }: { item: Post }) => (
			<PostCard
				post={item}
				canEdit={
					Boolean(currentUserId) &&
					(item.authorUserId === currentUserId ||
						item.author?.id === currentUserId)
				}
				onMenuPress={
					currentUserId &&
					(item.authorUserId === currentUserId ||
						item.author?.id === currentUserId)
						? () => handleMenuPress(item)
						: undefined
				}
			/>
		),
		[currentUserId, handleMenuPress],
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
			{editingPost?.cliqueId ? (
				<CreatePostModal
					visible={isModalOpen}
					cliqueId={editingPost.cliqueId}
					mode={modalMode}
					post={editingPost}
					onClose={handleCloseModal}
					onUpdated={handlePostUpdated}
				/>
			) : null}
		</Screen>
	);
}
