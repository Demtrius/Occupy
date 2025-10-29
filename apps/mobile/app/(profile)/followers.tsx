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
	useListFollowersQuery,
	useMeQuery,
	useRemoveFollowerMutation,
	useUserQuery,
} from "@/hooks";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type { Follow } from "@/types";

export default function FollowersPage() {
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
	const followersQuery = useListFollowersQuery(resolvedUserId);

	const removeFollowerMutation = useRemoveFollowerMutation();
	const [pendingActionId, setPendingActionId] = useState<string | null>(null);

	const isInitialLoading = isOwnProfile && !resolvedUserId;
	const isLoading =
		(!isOwnProfile && userQuery.isLoading) || followersQuery.isLoading;
	const hasError = (!isOwnProfile && userQuery.error) || followersQuery.error;

	const onRefresh = useCallback(() => {
		followersQuery.refetch();
	}, [followersQuery]);

	const onEndReached = useCallback(() => {
		if (
			followersQuery.hasNextPage &&
			!followersQuery.isFetchingNextPage &&
			!followersQuery.isLoading
		) {
			followersQuery.fetchNextPage();
		}
	}, [followersQuery]);

	const handleRemoveFollower = useCallback(
		async (follow: Follow) => {
			if (!isOwnProfile || !resolvedUserId) {
				return;
			}
			setPendingActionId(follow.id);
			try {
				await removeFollowerMutation.mutateAsync({
					params: {
						path: {
							userId: resolvedUserId,
							followerId: follow.followerUserId,
						},
					},
				});
				showToast({
					type: "success",
					message: "Follower removed",
				});
			} catch (error: unknown) {
				showToast({
					type: "error",
					message: getErrorMessage(error, "Failed to update follow"),
				});
			} finally {
				setPendingActionId(null);
			}
		},
		[isOwnProfile, removeFollowerMutation, resolvedUserId],
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

			const isPending = pendingActionId === item.id;
			return (
				<UserCard
					user={user}
					onPress={navigateToProfile}
					actionLabel="Remove"
					actionVariant="secondary"
					actionDisabled={isPending}
					onActionPress={() => handleRemoveFollower(item)}
				/>
			);
		},
		[handleRemoveFollower, isOwnProfile, pendingActionId, router],
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
						? "You don't have any followers yet"
						: "No followers to show"}
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
				message="Failed to load followers list"
				onRetry={() => {
					if (!isOwnProfile) {
						userQuery.refetch();
					}
					followersQuery.refetch();
				}}
			/>
		);
	}

	return (
		<Screen noTopPadding>
			<FlatList
				data={followersQuery.items}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				onEndReached={onEndReached}
				onEndReachedThreshold={0.6}
				refreshing={followersQuery.isRefetching}
				onRefresh={onRefresh}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: theme.spacing.m,
					paddingVertical: theme.spacing.l,
					flexGrow: followersQuery.items.length === 0 ? 1 : undefined,
				}}
				ListEmptyComponent={emptyComponent}
				ListFooterComponent={
					followersQuery.isFetchingNextPage ? (
						<Box paddingVertical="m" alignItems="center">
							<ActivityIndicator />
						</Box>
					) : null
				}
			/>
		</Screen>
	);
}
