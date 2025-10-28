import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Box } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import { useFollowMutation, useFollowStatusQuery } from "@/hooks";
import { showToast } from "@/stores/toast-store";
import type { User } from "@/types";

interface ProfileActionsProps {
	user: User | null | undefined;
	isOwnProfile: boolean;
	isLoading?: boolean;
}

export function ProfileActions({
	user,
	isOwnProfile,
	isLoading,
}: ProfileActionsProps) {
	const router = useRouter();
	const theme = useTheme<Theme>();
	const followMutation = useFollowMutation();
	const { data } = useFollowStatusQuery(user?.id);

	if (isLoading || !user) {
		return (
			<Box flexDirection="row" paddingHorizontal="l" marginBottom="l" gap="s">
				<Box flex={1} height={44} backgroundColor="muted" borderRadius="m" />
				<Box width={44} height={44} backgroundColor="muted" borderRadius="m" />
			</Box>
		);
	}

	if (isOwnProfile) {
		// Own profile: Edit and Settings buttons
		return (
			<Box flexDirection="row" paddingHorizontal="l" marginBottom="l" gap="s">
				<Box flex={1}>
					<Button onPress={() => router.push("/(profile)/edit")}>
						Edit Profile
					</Button>
				</Box>
				<Button variant="icon" onPress={() => router.push("/settings")}>
					<Ionicons
						name="settings-outline"
						size={24}
						color={theme.colors["primary-foreground"]}
					/>
				</Button>
			</Box>
		);
	}

	// Other user's profile: Follow/Unfollow button
	const handleFollowPress = async () => {
		if (!user?.id) return;
		try {
			await followMutation.mutateAsync({
				params: { path: { userId: user.id } },
			});
			// Toggle state optimistically
			showToast({
				type: "success",
				message: data?.isFollowing ? "Unfollowed" : "Followed",
			});
		} catch (error: any) {
			showToast({
				type: "error",
				message: error.message || "Failed to update follow status",
			});
		}
	};

	return (
		<Box paddingHorizontal="l" marginBottom="l">
			<Button onPress={handleFollowPress} disabled={followMutation.isPending}>
				{followMutation.isPending
					? "Loading..."
					: data?.isFollowing
						? "Unfollow"
						: "Follow"}
			</Button>
		</Box>
	);
}
