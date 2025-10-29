import { useTheme } from "@shopify/restyle";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";
import { UserCard } from "@/components/cards/user-card";
import { ErrorScreen } from "@/components/ui/error-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Box, Text } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import type { Theme } from "@/config/theme";
import {
	useFollowMutation,
	useListFollowingQuery,
	useMeQuery,
	useUnfollowUserMutation,
	useUserQuery,
} from "@/hooks";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type { Follow } from "@/types";

export default function FollowingPage() {
	const theme = useTheme<Theme>();
	const router = useRouter();
	const { userId } = useLocalSearchParams<{ userId?: string }>();
	const { data: currentUser } = useMeQuery();

	const targetUserId =
		typeof userId === "string" && userId.length > 0 ? userId : undefined;
	const isOwnProfile =
		!targetUserId || (currentUser?.id && targetUserId === currentUser.id);
	const resolvedUserId = isOwnProfile ? currentUser?.id : targetUserId;

	const userQuery = useUserQuery(isOwnProfile ? undefined : targetUserId);
	const followingQuery = useListFollowingQuery(resolvedUserId);

	const followMutation = useFollowMutation();
	const unfollowMutation = useUnfollowUserMutation();
	const [pendingFollowId, setPendingFollowId] = useState<string | null>(null);

	const isInitialLoading = isOwnProfile && !resolvedUserId;
	const isLoading =
		(!isOwnProfile && userQuery.isLoading) || followingQuery.isLoading;
	const hasError = (!isOwnProfile && userQuery.error) || followingQuery.error;

	const onRefresh = useCallback(() => {
		followingQuery.refetch();
	}, [followingQuery]);

	const onEndReached = useCallback(() => {
		if (
			followingQuery.hasNextPage &&
			!followingQuery.isFetchingNextPage &&
			!followingQuery.isLoading
		) {
			followingQuery.fetchNextPage();
		}
	}, [followingQuery]);

	const handleActionPress = useCallback(
		async (follow: Follow) => {
			if (!isOwnProfile) return;
			if (!follow.user?.id) {
				return;
			}
			setPendingFollowId(follow.id);
			try {
				if (follow.status === "accepted") {
					await unfollowMutation.mutateAsync({
						params: { path: { userId: follow.followeeUserId } },
					});
					showToast({
						type: "success",
						message: "Unfollowed",
					});
				} else if (follow.status === "pending") {
					await unfollowMutation.mutateAsync({
						params: { path: { userId: follow.followeeUserId } },
					});
					showToast({
						type: "success",
						message: "Follow request cancelled",
					});
				} else {
					await followMutation.mutateAsync({
						params: { path: { userId: follow.followeeUserId } },
					});
					showToast({
						type: "success",
						message: "Follow request sent",
					});
				}
			} catch (error: unknown) {
				showToast({
					type: "error",
					message: getErrorMessage(error, "Failed to update follow"),
				});
			} finally {
				setPendingFollowId(null);
			}
		},
		[followMutation, isOwnProfile, unfollowMutation],
	);

	const renderItem = useCallback(
		({ item }: { item: Follow }) => {
			const { user } = item;
			const navigateToProfile = () =>
				router.push({
					pathname: "/(tabs)/profile",
					params: { userId: user.id },
				});

			if (!isOwnProfile) {
				return <UserCard user={user} onPress={navigateToProfile} />;
			}

			const isPending = pendingFollowId === item.id;
			const label =
				item.status === "accepted"
					? "Unfollow"
					: item.status === "pending"
						? "Requested"
						: "Follow";
			const variant =
				item.status === "accepted"
					? ("secondary" as const)
					: ("primary" as const);
			return (
				<UserCard
					user={user}
					onPress={navigateToProfile}
					actionLabel={label}
					actionVariant={variant}
					actionDisabled={isPending}
					onActionPress={() => handleActionPress(item)}
				/>
			);
		},
		[handleActionPress, isOwnProfile, pendingFollowId, router],
	);

	const keyExtractor = useCallback((item: Follow) => item.id, []);

	const emptyComponent = useMemo(
		() => (
			<Box
				backgroundColor="muted"
				padding="l"
				borderRadius="m"
				alignItems="center"
			>
				<Text variant="body" textAlign="center">
					{isOwnProfile
						? "You aren't following anyone yet"
						: "No following yet"}
				</Text>
			</Box>
		),
		[isOwnProfile],
	);

	if (isInitialLoading || isLoading) {
		return <LoadingScreen />;
	}

	if (hasError) {
		return (
			<ErrorScreen
				message="Failed to load following list"
				onRetry={() => {
					if (!isOwnProfile) {
						userQuery.refetch();
					}
					followingQuery.refetch();
				}}
			/>
		);
	}

	return (
		<Screen noTopPadding>
			<FlatList
				data={followingQuery.items}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				onEndReached={onEndReached}
				onEndReachedThreshold={0.6}
				refreshing={followingQuery.isRefetching}
				onRefresh={onRefresh}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: theme.spacing.m,
					paddingVertical: theme.spacing.l,
					flexGrow: followingQuery.items.length === 0 ? 1 : undefined,
				}}
				ListEmptyComponent={emptyComponent}
				ListFooterComponent={
					followingQuery.isFetchingNextPage ? (
						<Box paddingVertical="m" alignItems="center">
							<ActivityIndicator />
						</Box>
					) : null
				}
			/>
		</Screen>
	);
}
