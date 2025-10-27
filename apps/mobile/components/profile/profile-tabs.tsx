import { useState } from "react";
import { ScrollView } from "react-native";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Text } from "@/components/ui/restyle-components";
import { TabsHeader } from "@/components/ui/tabs-header";
import {
	useListCliqueReviewsQuery,
	useListMyBookingsQuery,
	useListUserCliquesQuery,
	useListUserPostsQuery,
} from "@/hooks";
import type { Booking, Clique, Post, Review } from "@/types";
import type { UserProfile } from "@/types/users";
import { BookingCard } from "../cards/booking-card";
import { CliqueCard } from "../cards/clique-card";
import { PostCard } from "../cards/post-card";

interface ProfileTabsProps {
	user: UserProfile | null | undefined;
	isOwnProfile: boolean;
	isLoading?: boolean;
}

type TabType = "posts" | "cliques" | "reviews" | "bookings";

export function ProfileTabs({
	user,
	isOwnProfile,
	isLoading,
}: ProfileTabsProps) {
	const [activeTab, setActiveTab] = useState<TabType>("posts");

	// Data queries
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
	); // Note: This should be for user's owned cliques

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

	// Check if profile is private and not accessible
	const isPrivateAndNotAccessible =
		user.isPrivateAccount && !isOwnProfile && !user.isFollowing;

	const tabs: Array<{ key: TabType; label: string; show: boolean }> = [
		{
			key: "posts" as TabType,
			label: "Posts",
			show: !isPrivateAndNotAccessible,
		},
		{
			key: "cliques" as TabType,
			label: "Cliques",
			show: !isPrivateAndNotAccessible,
		},
		{
			key: "reviews" as TabType,
			label: "Reviews",
			show: user.isBusinessPage && !isPrivateAndNotAccessible,
		},
		{ key: "bookings" as TabType, label: "Bookings", show: isOwnProfile },
	].filter((tab) => tab.show);

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
			case "posts": {
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

				const posts = postsQuery.data?.items || [];
				if (posts.length === 0) {
					return <EmptyState message="No posts yet" />;
				}

				return (
					<ScrollView showsVerticalScrollIndicator={false}>
						<Box padding="s">
							{posts.map((post: Post) => (
								<PostCard key={post.id} post={post} />
							))}
						</Box>
					</ScrollView>
				);
			}

			case "cliques": {
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

				const cliques = cliquesQuery.data?.items || [];
				if (cliques.length === 0) {
					return <EmptyState message="No cliques yet" />;
				}

				return (
					<ScrollView showsVerticalScrollIndicator={false}>
						<Box padding="s">
							{cliques.map((clique: Clique) => (
								<CliqueCard key={clique.id} clique={clique} />
							))}
						</Box>
					</ScrollView>
				);
			}

			case "reviews": {
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

				const reviews = reviewsQuery.data?.items || [];
				if (reviews.length === 0) {
					return <EmptyState message="No reviews yet" />;
				}

				return (
					<ScrollView showsVerticalScrollIndicator={false}>
						<Box padding="s">
							{reviews.map((review: Review) => (
								<Box
									key={review.id}
									backgroundColor="card"
									borderRadius="m"
									padding="m"
									marginBottom="s"
									borderWidth={1}
									borderColor="border"
								>
									<Box flexDirection="row" alignItems="center" marginBottom="s">
										<Text variant="body" fontWeight="600">
											⭐ {review.rating}/5
										</Text>
										<Text
											variant="caption"
											color="muted-foreground"
											marginLeft="s"
										>
											{new Date(review.createdAt).toLocaleDateString()}
										</Text>
									</Box>
									{review.comment && (
										<Text variant="body" marginBottom="s">
											{review.comment}
										</Text>
									)}
								</Box>
							))}
						</Box>
					</ScrollView>
				);
			}

			case "bookings": {
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

				const bookings = bookingsQuery.data?.items || [];
				if (bookings.length === 0) {
					return <EmptyState message="No bookings yet" />;
				}

				return (
					<ScrollView showsVerticalScrollIndicator={false}>
						<Box padding="s">
							{bookings.map((booking: Booking) => (
								<BookingCard key={booking.id} booking={booking} />
							))}
						</Box>
					</ScrollView>
				);
			}

			default:
				return null;
		}
	};

	return (
		<Box>
			<TabsHeader
				tabs={tabs.map(({ key, label }) => ({ key, label }))}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>

			{/* Tab Content */}
			{renderTabContent()}
		</Box>
	);
}
