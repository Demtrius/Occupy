import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Avatar } from "@/components/ui/avatar";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { User, UserFollow } from "@/types";

interface UserCardProps {
	user: User | UserFollow;
}

export function UserCard({ user }: UserCardProps) {
	const theme = useTheme<Theme>();
	return (
		<Card variant="elevated" marginBottom="m">
			{/* User Header */}
			<Box flexDirection="row" alignItems="center" marginBottom="s">
				<Avatar
					size={40}
					source={
						user.profileImageUrl ? { uri: user.profileImageUrl } : undefined
					}
				/>
				<Box marginLeft="s" flex={1}>
					<Text variant="body" fontWeight="600" numberOfLines={1}>
						{user.username}
					</Text>
					<Text variant="caption" color="muted-foreground" numberOfLines={1}>
						{user.fullName}
					</Text>
				</Box>
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
	);
}
