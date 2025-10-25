import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { ProfileActions } from "@/components/profile/profile-actions";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { Screen } from "@/components/screen";
import { Button } from "@/components/ui/button";
import { Box, Text } from "@/components/ui/restyle-components";
import {
	useFollowMutation,
	useUnfollowMutation,
	useUserQuery,
} from "@/hooks/query";
import { useAuthStore } from "@/stores/auth-store";

export default function ProfilePage() {
	const { userId } = useLocalSearchParams<{ userId?: string }>();
	const router = useRouter();
	const currentUser = useAuthStore((s) => s.user);

	// If userId is provided, show that user's profile
	// Otherwise show current user's profile
	const isOwnProfile = !userId || userId === currentUser?.id;
	const profileUserId = userId || currentUser?.id;

	// Fetch user data for other users
	const userQuery = useUserQuery(isOwnProfile ? undefined : userId);
	const profileUser = isOwnProfile ? currentUser : userQuery.data || null;

	// Follow mutations
	const followMutation = useFollowMutation();
	const unfollowMutation = useUnfollowMutation();

	const handleFollow = () => {
		if (userId) {
			followMutation.mutate({ userId });
		}
	};

	const handleUnfollow = () => {
		if (userId) {
			unfollowMutation.mutate({ userId });
		}
	};

	const isLoading = isOwnProfile ? false : userQuery.isLoading;
	const error = isOwnProfile ? null : userQuery.error;

	// Show error state for other user profiles
	if (error && !isOwnProfile) {
		return (
			<Screen>
				<Box flex={1} alignItems="center" justifyContent="center" padding="l">
					<Text variant="body" textAlign="center" marginBottom="m">
						Failed to load profile
					</Text>
					<Text
						variant="caption"
						textAlign="center"
						color="destructive"
						marginBottom="l"
					>
						{error.message || "Something went wrong"}
					</Text>
					<Button onPress={() => userQuery.refetch()}>Try Again</Button>
				</Box>
			</Screen>
		);
	}

	return (
		<Screen>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingTop: 20 }}
			>
				{/* Profile Header */}
				<ProfileHeader
					user={profileUser}
					isLoading={isLoading}
					isOwnProfile={isOwnProfile}
				/>

				{/* Profile Stats */}
				<ProfileStats
					user={profileUser}
					isLoading={isLoading}
					isOwnProfile={isOwnProfile}
					onFollowersPress={() => {
						router.push(`/followers?userId=${profileUserId}`);
					}}
					onFollowingPress={() => {
						router.push(`/following?userId=${profileUserId}`);
					}}
				/>

				{/* Profile Actions */}
				<ProfileActions
					user={profileUser}
					isOwnProfile={isOwnProfile}
					isLoading={isLoading}
					onFollowPress={handleFollow}
					onUnfollowPress={handleUnfollow}
				/>

				{/* Profile Content Tabs */}
				<ProfileTabs
					user={profileUser}
					isOwnProfile={isOwnProfile}
					isLoading={isLoading}
				/>
			</ScrollView>
		</Screen>
	);
}
