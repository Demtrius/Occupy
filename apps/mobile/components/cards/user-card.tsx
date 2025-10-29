import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { type GestureResponderEvent, Pressable } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { User, UserFollow } from "@/types";

interface UserCardProps {
	user: User | UserFollow;
	onPress?: () => void;
	actionLabel?: string;
	onActionPress?: () => void;
	actionDisabled?: boolean;
	actionVariant?: "primary" | "secondary";
}

export function UserCard({
	user,
	onPress,
	actionLabel,
	onActionPress,
	actionDisabled,
	actionVariant = "secondary",
}: UserCardProps) {
	const router = useRouter();
	const theme = useTheme<Theme>();

	const handleCardPress = () => {
		if (onPress) {
			onPress();
			return;
		}
		// Default navigation to user profile if no handler provided
		router.push({
			pathname: "/(tabs)/profile",
			params: { userId: user.id },
		});
	};

	const handleActionPress = (event: GestureResponderEvent) => {
		event.stopPropagation();
		onActionPress?.();
	};

	const actionBackgroundColor =
		actionVariant === "primary" ? theme.colors.primary : theme.colors.secondary;
	const actionForegroundColor =
		actionVariant === "primary"
			? theme.colors["primary-foreground"]
			: theme.colors["secondary-foreground"];

	return (
		<Pressable
			onPress={handleCardPress}
			style={({ pressed }) => [{ opacity: pressed ? 0.96 : 1 }]}
		>
			<Card variant="elevated" marginBottom="m">
				{/* User Header */}
				<Box flexDirection="row" alignItems="center" marginBottom="s">
					<Avatar
						size={40}
						source={
							user.profileImageUrl ? { uri: user.profileImageUrl } : undefined
						}
						fallback={user.fullName?.charAt(0)?.toUpperCase()}
					/>
					<Box marginLeft="s" flex={1}>
						<Text variant="body" fontWeight="600" numberOfLines={1}>
							{user.username}
						</Text>
						<Text variant="caption" color="muted-foreground" numberOfLines={1}>
							{user.fullName}
						</Text>
					</Box>
					{actionLabel ? (
						<Pressable
							onPress={handleActionPress}
							disabled={actionDisabled}
							style={({ pressed }) => [
								{
									backgroundColor: actionBackgroundColor,
									borderRadius: theme.borderRadii.s,
									paddingHorizontal: theme.spacing.s,
									paddingVertical: theme.spacing.xs,
									opacity: actionDisabled ? 0.5 : pressed ? 0.8 : 1,
								},
							]}
						>
							<Text
								variant="caption"
								fontWeight="600"
								style={{ color: actionForegroundColor }}
							>
								{actionLabel}
							</Text>
						</Pressable>
					) : null}
				</Box>

				{/* User Bio */}
				{user.bio && (
					<Text variant="body" marginBottom="s" numberOfLines={2}>
						{user.bio}
					</Text>
				)}

				{/* User Stats */}
				<Box flexDirection="row" justifyContent="space-between">
					{user.isBusinessPage && (
						<Box flexDirection="row" alignItems="center">
							<Ionicons
								name="business-outline"
								size={16}
								color={theme.colors.primary}
							/>
							<Text variant="caption" color="primary" marginLeft="xs">
								Business
							</Text>
						</Box>
					)}
				</Box>
			</Card>
		</Pressable>
	);
}
