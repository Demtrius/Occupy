import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { UserCard } from "@/components/cards/user-card";
import { ErrorScreen } from "@/components/ui/error-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Box, Text } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { useListFollowingQuery, useUserQuery } from "@/hooks";

export default function FollowingPage() {
	const { userId } = useLocalSearchParams<{ userId?: string }>();
	const targetUserId = userId || "me";

	const userQuery = useUserQuery(targetUserId);
	const followingQuery = useListFollowingQuery(targetUserId);

	if (userQuery.isLoading || followingQuery.isLoading) {
		return <LoadingScreen />;
	}

	if (userQuery.error || followingQuery.error) {
		return (
			<ErrorScreen
				message="Failed to load following list"
				onRetry={() => {
					userQuery.refetch();
					followingQuery.refetch();
				}}
			/>
		);
	}

	const followingUsers = followingQuery.items.map((follow) => follow.user);

	return (
		<Screen noTopPadding>
			<ScrollView showsVerticalScrollIndicator={false}>
				<Box paddingVertical="l" paddingHorizontal="m">
					{followingUsers.length === 0 ? (
						<Box
							backgroundColor="muted"
							padding="l"
							borderRadius="m"
							alignItems="center"
						>
							<Text variant="body" textAlign="center">
								{userId ? "This user" : "You"} {userId ? "isn't" : "aren't"}{" "}
								following anyone yet
							</Text>
						</Box>
					) : (
						<Box gap="s">
							{followingUsers.map((user) => (
								<UserCard key={user.id} user={user} />
							))}
						</Box>
					)}
				</Box>
			</ScrollView>
		</Screen>
	);
}
