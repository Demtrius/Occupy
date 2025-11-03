import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Box } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import {
	useFollowMutation,
	useFollowStatusQuery,
	useMeQuery,
	useUnfollowUserMutation,
} from "@/hooks";
import { useCreateChatMutation } from "@/hooks/use-messaging";
import { getErrorMessage } from "@/lib/error-utils";
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
	const { data: currentUser } = useMeQuery();
	const followMutation = useFollowMutation();
	const unfollowMutation = useUnfollowUserMutation();
	const createChatMutation = useCreateChatMutation();
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

	// Other user's profile: Follow/Unfollow and Message buttons
	const handleFollowPress = async () => {
		if (!user?.id) return;
		try {
			if (data?.isFollowing || data?.isFollowRequested) {
				await unfollowMutation.mutateAsync({
					params: { path: { userId: user.id } },
				});
				showToast({
					type: "success",
					message: data?.isFollowing
						? "Unfollowed"
						: "Follow request cancelled",
				});
			} else {
				await followMutation.mutateAsync({
					params: { path: { userId: user.id } },
				});
				showToast({
					type: "success",
					message: user.isPrivateAccount
						? "Follow request sent"
						: "You are now following this user",
				});
			}
		} catch (error: unknown) {
			showToast({
				type: "error",
				message: getErrorMessage(error, "Failed to update follow status"),
			});
		}
	};

	const handleMessagePress = async () => {
		if (!user?.id || !currentUser?.id) return;
		try {
			const chat = await createChatMutation.mutateAsync({
				body: {
					businessUserId: currentUser.id,
					clientUserId: user.id,
				},
			});
			showToast({
				type: "success",
				message: "Chat opened",
			});
			router.push(`/chat/${chat.id}`);
		} catch (error: unknown) {
			showToast({
				type: "error",
				message: getErrorMessage(error, "Failed to create chat"),
			});
		}
	};

	const isMutationPending =
		followMutation.isPending ||
		unfollowMutation.isPending ||
		createChatMutation.isPending;

	const buttonLabel = (() => {
		if (isMutationPending) return "Loading...";
		if (data?.isFollowing) return "Unfollow";
		if (data?.isFollowRequested) return "Requested";
		return "Follow";
	})();

	return (
		<Box flexDirection="row" paddingHorizontal="l" marginBottom="l" gap="s">
			<Box flex={1}>
				<Button onPress={handleFollowPress} disabled={isMutationPending}>
					{buttonLabel}
				</Button>
			</Box>
			<Button
				variant="icon"
				onPress={handleMessagePress}
				disabled={isMutationPending}
			>
				<Ionicons
					name="mail-outline"
					size={24}
					color={theme.colors["primary-foreground"]}
				/>
			</Button>
		</Box>
	);
}
