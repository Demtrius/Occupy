import { useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { Box, Text } from "@/components/ui/restyle-components";
import {
	useListCliqueReviewsQuery,
	useListMyBookingsQuery,
	useListUserCliquesQuery,
	useListUserPostsQuery,
} from "@/hooks";
import type { Booking, Clique, Post, Review, User } from "@/types";
import { BookingCard } from "./booking-card";
import { CliqueCard } from "./clique-card";
import { PostCard } from "./post-card";

interface ProfileTabsProps {
	user: User | null | undefined;
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
					paddingVertical="l"
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
						<Box padding="l">
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
						<Box padding="l" alignItems="center">
							<Text variant="body" textAlign="center" marginBottom="s">
								Failed to load posts
							</Text>
							<Text variant="caption" textAlign="center">
								{postsQuery.error.message}
							</Text>
						</Box>
					);
				}

				const posts = postsQuery.data?.items || [];
				if (posts.length === 0) {
					return (
						<Box padding="l" alignItems="center">
							<Text variant="body" textAlign="center">
								No posts yet
							</Text>
						</Box>
					);
				}

				return (
					<ScrollView showsVerticalScrollIndicator={false}>
						<Box padding="l">
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
						<Box padding="l">
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
						<Box padding="l" alignItems="center">
							<Text variant="body" textAlign="center" marginBottom="s">
								Failed to load cliques
							</Text>
							<Text variant="caption" textAlign="center">
								{cliquesQuery.error.message}
							</Text>
						</Box>
					);
				}

				const cliques = cliquesQuery.data?.items || [];
				if (cliques.length === 0) {
					return (
						<Box padding="l" alignItems="center">
							<Text variant="body" textAlign="center">
								No cliques yet
							</Text>
						</Box>
					);
				}

				return (
					<ScrollView showsVerticalScrollIndicator={false}>
						<Box padding="l">
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
						<Box padding="l">
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
						<Box padding="l" alignItems="center">
							<Text variant="body" textAlign="center" marginBottom="s">
								Failed to load reviews
							</Text>
							<Text variant="caption" textAlign="center">
								{reviewsQuery.error.message}
							</Text>
						</Box>
					);
				}

				const reviews = reviewsQuery.data?.items || [];
				if (reviews.length === 0) {
					return (
						<Box padding="l" alignItems="center">
							<Text variant="body" textAlign="center">
								No reviews yet
							</Text>
						</Box>
					);
				}

				return (
					<ScrollView showsVerticalScrollIndicator={false}>
						<Box padding="l">
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
									{review.rater && (
										<Text variant="caption" color="muted-foreground">
											By {review.rater.username}
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
						<Box padding="l">
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
						<Box padding="l" alignItems="center">
							<Text variant="body" textAlign="center" marginBottom="s">
								Failed to load bookings
							</Text>
							<Text variant="caption" textAlign="center">
								{bookingsQuery.error.message}
							</Text>
						</Box>
					);
				}

				const bookings = bookingsQuery.data?.items || [];
				if (bookings.length === 0) {
					return (
						<Box padding="l" alignItems="center">
							<Text variant="body" textAlign="center">
								No bookings yet
							</Text>
						</Box>
					);
				}

				return (
					<ScrollView showsVerticalScrollIndicator={false}>
						<Box padding="l">
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
		<Box paddingVertical="l">
			{/* Tab Headers */}
			<Box flexDirection="row" marginBottom="m">
				{tabs.map((tab) => (
					<Pressable
						key={tab.key}
						onPress={() => setActiveTab(tab.key)}
						style={{ flex: 1 }}
					>
						<Box
							paddingVertical="s"
							alignItems="center"
							borderBottomWidth={activeTab === tab.key ? 2 : 0}
							borderBottomColor="primary"
						>
							<Text
								variant="body"
								color={activeTab === tab.key ? "primary" : "muted-foreground"}
								fontWeight={activeTab === tab.key ? "600" : "400"}
							>
								{tab.label}
							</Text>
						</Box>
					</Pressable>
				))}
			</Box>

			{/* Tab Content */}
			{renderTabContent()}
		</Box>
	);
}
