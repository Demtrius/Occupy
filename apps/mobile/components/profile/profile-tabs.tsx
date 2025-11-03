import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList } from "react-native";
import { BookingCard } from "@/components/cards/booking-card";
import { CliqueCard } from "@/components/cards/clique-card";
import { PostCard } from "@/components/cards/post-card";
import { ReviewCard } from "@/components/cards/review-card";
import { CreateCliqueModal } from "@/components/clique/create-clique-modal";
import { CreatePostModal } from "@/components/clique/create-post-modal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Text } from "@/components/ui/restyle-components";
import { TabsHeader } from "@/components/ui/tabs-header";
import type { Theme } from "@/config/theme";
import {
	useCancelBookingMutation,
	useDeletePostMutation,
	useFollowStatusQuery,
	useListCliqueReviewsQuery,
	useListMyBookingsQuery,
	useListUserCliquesQuery,
	useListUserPostsQuery,
	useMeQuery,
	useRescheduleBookingMutation,
} from "@/hooks";
import { getErrorMessage } from "@/lib/error-utils";
import { presentOverflowMenu } from "@/lib/overflow-menu";
import { showToast } from "@/stores/toast-store";
import type { Booking, Clique, Post, Review, User } from "@/types";

interface ProfileTabsProps {
	user: User | null | undefined;
	isOwnProfile: boolean;
	isLoading?: boolean;
}

enum TabType {
	Posts = "posts",
	Cliques = "cliques",
	Reviews = "reviews",
	Bookings = "bookings",
}

export function ProfileTabs({
	user,
	isOwnProfile,
	isLoading,
}: ProfileTabsProps) {
	const theme = useTheme<Theme>();
	const meQuery = useMeQuery();
	const deletePostMutation = useDeletePostMutation();
	const cancelBookingMutation = useCancelBookingMutation();
	const rescheduleBookingMutation = useRescheduleBookingMutation();
	const currentUserId = meQuery.data?.id;
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<TabType>(TabType.Posts);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [editingPost, setEditingPost] = useState<Post | null>(null);
	const [isCliqueModalOpen, setIsCliqueModalOpen] = useState(false);

	const postsQuery = useListUserPostsQuery(
		user?.id,
		activeTab === "posts" && !isLoading,
	);
	const cliquesQuery = useListUserCliquesQuery(
		user?.id,
		activeTab === "cliques" && !isLoading,
	);
	const bookingsQuery = useListMyBookingsQuery(
		activeTab === "bookings" && isOwnProfile && !isLoading,
	);
	const reviewsQuery = useListCliqueReviewsQuery(
		user?.id,
		activeTab === "reviews" && !isLoading,
	);

	const { data } = useFollowStatusQuery(user?.id);

	const sortedCliques = useMemo(() => {
		const items = cliquesQuery.items ?? [];
		const ownerId = user?.id;
		if (!ownerId) {
			return items;
		}
		return [...items].sort((a, b) => {
			const aOwned = a.ownerUserId === ownerId;
			const bOwned = b.ownerUserId === ownerId;
			if (aOwned === bOwned) return 0;
			return aOwned ? -1 : 1;
		});
	}, [cliquesQuery.items, user?.id]);

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
			postsQuery.refetch();
		},
		[postsQuery],
	);

	const handleOpenCliqueModal = useCallback(() => {
		setIsCliqueModalOpen(true);
	}, []);

	const handleCloseCliqueModal = useCallback(() => {
		setIsCliqueModalOpen(false);
	}, []);

	const handleCliqueCreated = useCallback(
		(_clique: Clique) => {
			cliquesQuery.refetch();
		},
		[cliquesQuery],
	);

	const handleCancelBooking = useCallback(
		async (bookingId: string, reason?: string) => {
			try {
				await cancelBookingMutation.mutateAsync({
					params: {
						path: { bookingId },
						query: reason ? { reason } : undefined,
					},
				});
				showToast({
					type: "success",
					message: "Booking cancelled",
				});
				bookingsQuery.refetch();
			} catch (error: unknown) {
				showToast({
					type: "error",
					message: getErrorMessage(error, "Failed to cancel booking"),
				});
			}
		},
		[cancelBookingMutation, bookingsQuery],
	);

	const handleRescheduleBooking = useCallback(
		async (bookingId: string, newStartTime: Date) => {
			try {
				await rescheduleBookingMutation.mutateAsync({
					params: { path: { bookingId } },
					body: { startTs: newStartTime.toISOString() },
				});
				showToast({
					type: "success",
					message: "Booking rescheduled",
				});
				bookingsQuery.refetch();
			} catch (error: unknown) {
				showToast({
					type: "error",
					message: getErrorMessage(error, "Failed to reschedule booking"),
				});
			}
		},
		[rescheduleBookingMutation, bookingsQuery],
	);

	const _handleReviewBooking = useCallback(
		(bookingId: string) => {
			// TODO: Navigate to review screen or open review modal
			router.push({ pathname: "/bookings/[id]", params: { id: bookingId } });
		},
		[router],
	);

	if (isLoading || !user) {
		return (
			<Box padding="l">
				<Box
					height={40}
					backgroundColor="muted"
					borderRadius="m"
					marginBottom="l"
				/>
				<Box height={200} backgroundColor="muted" borderRadius="m" />
			</Box>
		);
	}

	const isPrivateAndNotAccessible =
		user.isPrivateAccount && !isOwnProfile && !data?.isFollowing;

	const tabs: Array<{ key: TabType; label: string; show: boolean }> = [
		{ key: TabType.Posts, label: "Posts", show: !isPrivateAndNotAccessible },
		{
			key: TabType.Cliques,
			label: "Cliques",
			show: !isPrivateAndNotAccessible,
		},
		{
			key: TabType.Reviews,
			label: "Reviews",
			show: user.isBusinessPage && !isPrivateAndNotAccessible,
		},
		{ key: TabType.Bookings, label: "Bookings", show: isOwnProfile },
	].filter((tab) => tab.show);

	const handleNavigateToClique = (id: string) => {
		router.push({ pathname: "/cliques/[id]", params: { id } });
	};

	const renderPostItem = ({ item }: { item: Post }) => (
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
	);

	const renderOwnedAwareCliqueItem = ({ item }: { item: Clique }) => (
		<CliqueCard
			clique={item}
			onPress={() => handleNavigateToClique(item.id)}
			isOwned={item.ownerUserId === currentUserId}
		/>
	);

	const renderReviewItem = ({ item }: { item: Review }) => (
		<ReviewCard review={item} />
	);

	const renderBookingItem = ({ item }: { item: Booking }) => (
		<BookingCard
			booking={item}
			currentUserId={currentUserId}
			isCliqueOwner={false}
			cliqueCancellationCutoffHours={24}
			onConfirm={undefined} // Users cannot confirm their own bookings
			onCancel={handleCancelBooking}
			onReschedule={handleRescheduleBooking}
		/>
	);

	const renderListFooter = (isFetching: boolean) =>
		isFetching ? (
			<Box paddingVertical="m" alignItems="center">
				<ActivityIndicator />
			</Box>
		) : null;

	const renderTabContent = () => {
		if (isPrivateAndNotAccessible) {
			return (
				<Box
					paddingHorizontal="xs"
					backgroundColor="muted"
					borderRadius="m"
					alignItems="center"
				>
					<Text variant="body" textAlign="center">
						This account is private
					</Text>
					<Text variant="caption" textAlign="center" marginTop="s">
						Follow this user to see their posts and activity
					</Text>
				</Box>
			);
		}

		switch (activeTab) {
			case TabType.Posts: {
				if (postsQuery.isLoading) {
					return (
						<Box padding="s">
							<Box
								height={100}
								backgroundColor="muted"
								borderRadius="m"
								marginBottom="s"
							/>
							<Box height={100} backgroundColor="muted" borderRadius="m" />
						</Box>
					);
				}

				if (postsQuery.error) {
					return (
						<Box padding="s" alignItems="center">
							<Text variant="body" textAlign="center" marginBottom="s">
								Failed to load posts
							</Text>
							<Text variant="caption" textAlign="center">
								Error loading posts
							</Text>
						</Box>
					);
				}

				const posts = postsQuery.items;
				return (
					<FlatList
						key="tab-posts"
						data={posts}
						renderItem={renderPostItem}
						keyExtractor={(item) => item.id}
						onEndReached={
							postsQuery.hasNextPage
								? () => {
										if (!postsQuery.isFetchingNextPage) {
											postsQuery.fetchNextPage();
										}
									}
								: undefined
						}
						onEndReachedThreshold={0.5}
						refreshing={postsQuery.isRefetching}
						onRefresh={postsQuery.refetch}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{
							padding: theme.spacing.s,
							flexGrow: posts.length === 0 ? 1 : undefined,
						}}
						ListEmptyComponent={<EmptyState message="No posts yet" />}
						ListFooterComponent={renderListFooter(
							Boolean(postsQuery.isFetchingNextPage),
						)}
					/>
				);
			}

			case TabType.Cliques: {
				if (cliquesQuery.isLoading) {
					return (
						<Box padding="s">
							<Box
								height={80}
								backgroundColor="muted"
								borderRadius="m"
								marginBottom="s"
							/>
							<Box height={80} backgroundColor="muted" borderRadius="m" />
						</Box>
					);
				}

				if (cliquesQuery.error) {
					return (
						<Box padding="s" alignItems="center">
							<Text variant="body" textAlign="center" marginBottom="s">
								Failed to load cliques
							</Text>
							<Text variant="caption" textAlign="center">
								Error loading cliques
							</Text>
						</Box>
					);
				}

				return (
					<FlatList
						key="tab-cliques"
						data={sortedCliques}
						renderItem={renderOwnedAwareCliqueItem}
						keyExtractor={(item) => item.id}
						onEndReached={
							cliquesQuery.hasNextPage
								? () => {
										if (!cliquesQuery.isFetchingNextPage) {
											cliquesQuery.fetchNextPage();
										}
									}
								: undefined
						}
						onEndReachedThreshold={0.5}
						refreshing={cliquesQuery.isRefetching}
						onRefresh={cliquesQuery.refetch}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{
							padding: theme.spacing.s,
							flexGrow: sortedCliques.length === 0 ? 1 : undefined,
						}}
						ListHeaderComponent={
							isOwnProfile ? (
								<Box marginBottom="m">
									<Button variant="primary" onPress={handleOpenCliqueModal}>
										Create Clique
									</Button>
								</Box>
							) : null
						}
						ListEmptyComponent={
							<EmptyState
								message={
									isOwnProfile ? "No cliques yet" : "No cliques to display"
								}
							/>
						}
						ListFooterComponent={renderListFooter(
							Boolean(cliquesQuery.isFetchingNextPage),
						)}
					/>
				);
			}

			case TabType.Reviews: {
				if (reviewsQuery.isLoading) {
					return (
						<Box padding="s">
							<Box
								height={60}
								backgroundColor="muted"
								borderRadius="m"
								marginBottom="s"
							/>
							<Box height={60} backgroundColor="muted" borderRadius="m" />
						</Box>
					);
				}

				if (reviewsQuery.error) {
					return (
						<Box padding="s" alignItems="center">
							<Text variant="body" textAlign="center" marginBottom="s">
								Failed to load reviews
							</Text>
							<Text variant="caption" textAlign="center">
								Error loading reviews
							</Text>
						</Box>
					);
				}

				const reviews = reviewsQuery.items;
				return (
					<FlatList
						key="tab-reviews"
						data={reviews}
						renderItem={renderReviewItem}
						keyExtractor={(item) => item.id}
						onEndReached={
							reviewsQuery.hasNextPage
								? () => {
										if (!reviewsQuery.isFetchingNextPage) {
											reviewsQuery.fetchNextPage();
										}
									}
								: undefined
						}
						onEndReachedThreshold={0.5}
						refreshing={reviewsQuery.isRefetching}
						onRefresh={reviewsQuery.refetch}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{
							padding: theme.spacing.s,
							flexGrow: reviews.length === 0 ? 1 : undefined,
						}}
						ListEmptyComponent={<EmptyState message="No reviews yet" />}
						ListFooterComponent={renderListFooter(
							Boolean(reviewsQuery.isFetchingNextPage),
						)}
					/>
				);
			}

			case TabType.Bookings: {
				if (bookingsQuery.isLoading) {
					return (
						<Box padding="s">
							<Box
								height={100}
								backgroundColor="muted"
								borderRadius="m"
								marginBottom="s"
							/>
							<Box height={100} backgroundColor="muted" borderRadius="m" />
						</Box>
					);
				}

				if (bookingsQuery.error) {
					return (
						<Box padding="s" alignItems="center">
							<Text variant="body" textAlign="center" marginBottom="s">
								Failed to load bookings
							</Text>
							<Text variant="caption" textAlign="center">
								Error loading bookings
							</Text>
						</Box>
					);
				}

				const bookings = bookingsQuery.items;
				return (
					<FlatList
						key="tab-bookings"
						data={bookings}
						renderItem={renderBookingItem}
						keyExtractor={(item) => item.id}
						onEndReached={
							bookingsQuery.hasNextPage
								? () => {
										if (!bookingsQuery.isFetchingNextPage) {
											bookingsQuery.fetchNextPage();
										}
									}
								: undefined
						}
						onEndReachedThreshold={0.5}
						refreshing={bookingsQuery.isRefetching}
						onRefresh={bookingsQuery.refetch}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{
							padding: theme.spacing.s,
							flexGrow: bookings.length === 0 ? 1 : undefined,
						}}
						ListEmptyComponent={<EmptyState message="No bookings yet" />}
						ListFooterComponent={renderListFooter(
							Boolean(bookingsQuery.isFetchingNextPage),
						)}
					/>
				);
			}

			default:
				return null;
		}
	};

	return (
		<Box flex={1}>
			<TabsHeader
				tabs={tabs.map(({ key, label }) => ({ key, label }))}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
			<Box flex={1}>{renderTabContent()}</Box>
			{isOwnProfile ? (
				<CreateCliqueModal
					visible={isCliqueModalOpen}
					mode="create"
					onClose={handleCloseCliqueModal}
					onCreated={handleCliqueCreated}
				/>
			) : null}
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
		</Box>
	);
}
