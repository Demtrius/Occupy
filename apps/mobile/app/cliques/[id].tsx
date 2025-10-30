import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { CliqueAboutTab } from "@/components/clique/clique-about-tab";
import { CliqueAvailabilityTab } from "@/components/clique/clique-availability-tab";
import { CliqueBookingsTab } from "@/components/clique/clique-bookings-tab";
import { CliqueHeader } from "@/components/clique/clique-header";
import { CliquePostsTab } from "@/components/clique/clique-posts-tab";
import { CliqueReviewsTab } from "@/components/clique/clique-reviews-tab";
import { CliqueServicesTab } from "@/components/clique/clique-services-tab";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Screen } from "@/components/ui/screen";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";
import { ScrollableTabs } from "@/components/ui/scrollable-tabs";
import { useListCliqueAvailabilityQuery } from "@/hooks/use-availability";
import { useListCliqueBookingsQuery } from "@/hooks/use-bookings";
import {
	useGetCliqueQuery,
	useJoinCliqueMutation,
	useLeaveCliqueMutation,
} from "@/hooks/use-cliques";
import { useListCliquePostsQuery } from "@/hooks/use-posts";
import { useListCliqueReviewsQuery } from "@/hooks/use-reviews";
import { useListCliqueServicesQuery } from "@/hooks/use-services";
import { useMeQuery, useUserQuery } from "@/hooks/use-users";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type {
	Availability,
	Booking,
	Clique,
	Post,
	Review,
	Service,
} from "@/types";

type CliqueTab =
	| "about"
	| "services"
	| "availability"
	| "bookings"
	| "posts"
	| "reviews";

export default function CliqueDetailPage() {
	const { id } = useLocalSearchParams<{ id?: string }>();
	const cliqueId = id ?? "";
	const scrollViewRef = useRef<ScrollView>(null);
	const [showScrollToTop, setShowScrollToTop] = useState(false);

	const cliqueQuery = useGetCliqueQuery(cliqueId || undefined);
	const clique: Clique | undefined = cliqueQuery.data;
	const ownerQuery = useUserQuery(clique?.ownerUserId);
	const meQuery = useMeQuery();

	const servicesQuery = useListCliqueServicesQuery(cliqueId || undefined);
	const availabilityQuery = useListCliqueAvailabilityQuery(
		cliqueId || undefined,
	);
	const bookingsQuery = useListCliqueBookingsQuery(cliqueId || undefined);
	const postsQuery = useListCliquePostsQuery(cliqueId || undefined);
	const reviewsQuery = useListCliqueReviewsQuery(cliqueId || undefined);
	const joinMutation = useJoinCliqueMutation();
	const leaveMutation = useLeaveCliqueMutation();

	const [activeTab, setActiveTab] = useState<CliqueTab>("about");

	const currentUserId = meQuery.data?.id;
	const isOwner = Boolean(
		clique?.ownerUserId && clique.ownerUserId === currentUserId,
	);

	const membershipStatus: "joined" | "pending" | "none" = useMemo(() => {
		if (isOwner) return "joined";
		switch (clique?.membershipStatus) {
			case "joined":
				return "joined";
			case "pending":
				return "pending";
			default:
				return "none";
		}
	}, [clique?.membershipStatus, isOwner]);

	const isMember = membershipStatus === "joined";

	const handleJoin = useCallback(async () => {
		if (!cliqueId) return;
		try {
			await joinMutation.mutateAsync({
				params: { path: { cliqueId } },
			});
			showToast({ type: "success", message: "Join request submitted" });
			cliqueQuery.refetch();
		} catch (error: unknown) {
			showToast({
				type: "error",
				message: getErrorMessage(error, "Unable to join clique"),
			});
		}
	}, [cliqueId, joinMutation, cliqueQuery]);

	const handleLeave = useCallback(async () => {
		if (!cliqueId) return;
		try {
			await leaveMutation.mutateAsync({
				params: { path: { cliqueId } },
			});
			showToast({ type: "success", message: "You left the clique" });
			cliqueQuery.refetch();
		} catch (error: unknown) {
			showToast({
				type: "error",
				message: getErrorMessage(error, "Unable to leave clique"),
			});
		}
	}, [cliqueId, leaveMutation, cliqueQuery]);

	const tabs = useMemo(
		() => [
			{ key: "about" as const, label: "About" },
			{ key: "services" as const, label: "Services" },
			{ key: "availability" as const, label: "Availability" },
			{ key: "bookings" as const, label: "Bookings" },
			{ key: "posts" as const, label: "Posts" },
			{ key: "reviews" as const, label: "Reviews" },
		],
		[],
	);

	const renderActiveTab = useCallback(() => {
		if (!clique) {
			return <EmptyState message="Clique not found" />;
		}

		switch (activeTab) {
			case "about":
				return <CliqueAboutTab clique={clique} owner={ownerQuery.data} />;
			case "services":
				return (
					<CliqueServicesTab
						services={(servicesQuery.data as Service[]) ?? []}
						isOwner={isOwner}
						onCreateService={() => {
							showToast({
								type: "info",
								message: "Service creation coming soon",
							});
						}}
						isLoading={servicesQuery.isLoading}
					/>
				);
			case "availability":
				return (
					<CliqueAvailabilityTab
						availability={(availabilityQuery.data as Availability[]) ?? []}
						isOwner={isOwner}
						onCreateAvailability={() => {
							showToast({
								type: "info",
								message: "Availability creation coming soon",
							});
						}}
						isLoading={availabilityQuery.isLoading}
					/>
				);
			case "bookings":
				return (
					<CliqueBookingsTab
						bookings={bookingsQuery.items as Booking[]}
						isOwner={isOwner}
						currentUserId={currentUserId}
						onEndReached={() => {
							if (
								bookingsQuery.hasNextPage &&
								!bookingsQuery.isFetchingNextPage
							) {
								bookingsQuery.fetchNextPage();
							}
						}}
						isLoading={bookingsQuery.isLoading}
						isFetchingMore={bookingsQuery.isFetchingNextPage}
					/>
				);
			case "posts":
				return (
					<CliquePostsTab
						posts={postsQuery.items as Post[]}
						isMember={isMember || isOwner}
						onCreatePost={() => {
							showToast({
								type: "info",
								message: "Post creation coming soon",
							});
						}}
						isLoading={postsQuery.isLoading}
						onEndReached={() => {
							if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
								postsQuery.fetchNextPage();
							}
						}}
						isFetchingMore={postsQuery.isFetchingNextPage}
					/>
				);
			case "reviews":
				return (
					<CliqueReviewsTab
						reviews={reviewsQuery.items as Review[]}
						isLoading={reviewsQuery.isLoading}
						onEndReached={() => {
							if (
								reviewsQuery.hasNextPage &&
								!reviewsQuery.isFetchingNextPage
							) {
								reviewsQuery.fetchNextPage();
							}
						}}
						isFetchingMore={reviewsQuery.isFetchingNextPage}
					/>
				);
			default:
				return null;
		}
	}, [
		activeTab,
		availabilityQuery.data,
		availabilityQuery.isLoading,
		bookingsQuery.fetchNextPage,
		bookingsQuery.hasNextPage,
		bookingsQuery.isFetchingNextPage,
		bookingsQuery.isLoading,
		bookingsQuery.items,
		clique,
		currentUserId,
		isMember,
		isOwner,
		ownerQuery.data,
		postsQuery.fetchNextPage,
		postsQuery.hasNextPage,
		postsQuery.isFetchingNextPage,
		postsQuery.isLoading,
		postsQuery.items,
		reviewsQuery.fetchNextPage,
		reviewsQuery.hasNextPage,
		reviewsQuery.isFetchingNextPage,
		reviewsQuery.isLoading,
		reviewsQuery.items,
		servicesQuery.data,
		servicesQuery.isLoading,
	]);

	if (cliqueQuery.isLoading || !clique) {
		return <LoadingScreen />;
	}

	return (
		<Screen>
			<ScrollView
				ref={scrollViewRef}
				contentContainerStyle={{}}
				showsVerticalScrollIndicator={false}
				onScroll={(event) => {
					const scrollY = event.nativeEvent.contentOffset.y;
					setShowScrollToTop(scrollY > 300);
				}}
				scrollEventThrottle={16}
			>
				<CliqueHeader
					clique={clique}
					membersCount={clique.membersCount}
					isOwner={isOwner}
					membershipStatus={membershipStatus}
					isLoadingAction={joinMutation.isPending || leaveMutation.isPending}
					onJoin={handleJoin}
					onLeave={handleLeave}
				/>

				<ScrollableTabs
					tabs={tabs}
					activeTab={activeTab}
					onTabChange={setActiveTab}
				/>

				{renderActiveTab()}
			</ScrollView>
			{showScrollToTop && (
				<ScrollToTopButton
					onPress={() =>
						scrollViewRef.current?.scrollTo({ y: 0, animated: true })
					}
				/>
			)}
		</Screen>
	);
}
