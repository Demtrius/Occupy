import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { ProfileActions } from "@/components/profile/profile-actions";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { Screen } from "@/components/screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
	useFollowMutation,
	useMeQuery,
	useUnfollowMutation,
	useUserQuery,
} from "@/hooks";

export default function ProfilePage() {
	const { userId } = useLocalSearchParams<{ userId?: string }>();
	const router = useRouter();
	const { data: currentUser } = useMeQuery();

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

	if (isLoading) {
		return <LoadingScreen />;
	}

	// Show error state for other user profiles
	if (error && !isOwnProfile) {
		return (
			<ErrorScreen
				message={`Failed to load profile: ${error.message || "Something went wrong"}`}
				onRetry={() => userQuery.refetch()}
			/>
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
