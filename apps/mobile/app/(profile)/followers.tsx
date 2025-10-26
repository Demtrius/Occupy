import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { UserCard } from "@/components/cards/user-card";
import { ErrorScreen } from "@/components/ui/error-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Box, Text } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { useListFollowersQuery, useUserQuery } from "@/hooks";

export default function FollowersPage() {
	const { userId } = useLocalSearchParams<{ userId?: string }>();
	const targetUserId = userId || "me";

	const userQuery = useUserQuery(targetUserId);
	const followersQuery = useListFollowersQuery(targetUserId);

	if (userQuery.isLoading || followersQuery.isLoading) {
		return <LoadingScreen />;
	}

	if (userQuery.error || followersQuery.error) {
		return (
			<ErrorScreen
				message="Failed to load followers list"
				onRetry={() => {
					userQuery.refetch();
					followersQuery.refetch();
				}}
			/>
		);
	}

	const followerUsers =
		followersQuery.data?.items.map((follow) => follow.user) || [];

	return (
		<Screen noTopPadding>
			<ScrollView showsVerticalScrollIndicator={false}>
				<Box paddingVertical="l" paddingHorizontal="m">
					{followerUsers.length === 0 ? (
						<Box
							backgroundColor="muted"
							padding="l"
							borderRadius="m"
							alignItems="center"
						>
							<Text variant="body" textAlign="center">
								{userId ? "This user" : "You"} {userId ? "hasn't" : "haven't"}{" "}
								got any followers yet
							</Text>
						</Box>
					) : (
						<Box gap="s">
							{followerUsers.map((user) => (
								<UserCard key={user.id} user={user} />
							))}
						</Box>
					)}
				</Box>
			</ScrollView>
		</Screen>
	);
}
