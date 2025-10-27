import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Box } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { User } from "@/types";

interface ProfileActionsProps {
	user: User | null | undefined;
	isOwnProfile: boolean;
	isLoading?: boolean;
	onFollowPress?: () => void;
}

export function ProfileActions({
	user,
	isOwnProfile,
	isLoading,
	onFollowPress,
}: ProfileActionsProps) {
	const router = useRouter();
	const theme = useTheme<Theme>();

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

	//TODO: implement follow/unfollow logic
	// Other user's profile: Follow/Unfollow button
	const isFollowing = false; //user.isFollowing;
	const isFollowRequested = false; //user.isFollowRequested;

	return (
		<Box paddingHorizontal="l" marginBottom="l">
			<Button onPress={onFollowPress} disabled={isFollowRequested}>
				{isFollowRequested ? "Requested" : isFollowing ? "Unfollow" : "Follow"}
			</Button>
		</Box>
	);
}
