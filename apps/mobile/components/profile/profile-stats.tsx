import { Pressable } from "react-native";
import { Box, Text } from "@/components/ui/restyle-components";
import type { UserProfile } from "@/types/users";

interface ProfileStatsProps {
	user: UserProfile | null | undefined;
	isLoading?: boolean;
	isOwnProfile?: boolean;
	onFollowersPress?: () => void;
	onFollowingPress?: () => void;
}

interface StatItemProps {
	label: string;
	value: number;
	onPress?: () => void;
}

function StatItem({ label, value, onPress }: StatItemProps) {
	const content = (
		<Box alignItems="center">
			<Text variant="subheader" fontWeight="600">
				{value.toLocaleString()}
			</Text>
			<Text variant="caption" color="muted-foreground">
				{label}
			</Text>
		</Box>
	);

	if (onPress) {
		return (
			<Pressable onPress={onPress} hitSlop={10}>
				{content}
			</Pressable>
		);
	}

	return content;
}

export function ProfileStats({
	user,
	isLoading,
	isOwnProfile = false,
	onFollowersPress,
	onFollowingPress,
}: ProfileStatsProps) {
	if (isLoading || !user) {
		return (
			<Box
				flexDirection="row"
				justifyContent="center"
				paddingHorizontal="l"
				paddingVertical="m"
				gap="xl"
			>
				{[1, 2].map((i) => (
					<Box key={i} alignItems="center">
						<Box
							width={40}
							height={20}
							backgroundColor="muted"
							borderRadius="s"
							marginBottom="xs"
						/>
						<Box
							width={30}
							height={14}
							backgroundColor="muted"
							borderRadius="s"
						/>
					</Box>
				))}
			</Box>
		);
	}

	// Check if profile is private and not accessible
	const isPrivateAndNotAccessible =
		user.isPrivateAccount && !isOwnProfile && !user.isFollowing;

	return (
		<Box
			flexDirection="row"
			justifyContent="center"
			paddingHorizontal="l"
			paddingVertical="m"
			gap="xl"
		>
			<StatItem
				label="Followers"
				value={isPrivateAndNotAccessible ? 0 : user.followersCount || 0}
				onPress={isPrivateAndNotAccessible ? undefined : onFollowersPress}
			/>
			<StatItem
				label="Following"
				value={isPrivateAndNotAccessible ? 0 : user.followingCount || 0}
				onPress={isPrivateAndNotAccessible ? undefined : onFollowingPress}
			/>
		</Box>
	);
}
