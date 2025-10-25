import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/avatar";
import { Box, Text } from "@/components/ui/restyle-components";
import type { User } from "@/types/user";

interface ProfileHeaderProps {
	user: User | null;
	isLoading?: boolean;
	isOwnProfile?: boolean;
}

export function ProfileHeader({
	user,
	isLoading,
	isOwnProfile = false,
}: ProfileHeaderProps) {
	if (isLoading || !user) {
		return (
			<Box alignItems="center" paddingTop="l">
				<Box
					width={80}
					height={80}
					borderRadius="xl"
					backgroundColor="muted"
					marginBottom="m"
				/>
				<Box
					height={20}
					width={120}
					backgroundColor="muted"
					borderRadius="s"
					marginBottom="s"
				/>
				<Box height={16} width={80} backgroundColor="muted" borderRadius="s" />
			</Box>
		);
	}

	// Check if profile is private and not accessible
	const isPrivateAndNotAccessible =
		user.isPrivateAccount && !isOwnProfile && !user.isFollowing;

	return (
		<Box alignItems="center" paddingTop="l" paddingHorizontal="l" rowGap="s">
			{/* Avatar - always visible */}
			<Avatar
				size={80}
				source={
					user.profileImageUrl ? { uri: user.profileImageUrl } : undefined
				}
				fallback={user?.username?.[0]?.toUpperCase()}
				marginBottom="s"
			/>

			{/* Name and Username - always visible */}
			{user.fullName && (
				<Text variant="subheader" textAlign="center">
					{user.fullName}
				</Text>
			)}
			<Text
				variant="body"
				color="muted-foreground"
				textAlign="center"
				marginBottom="s"
			>
				@{user.username}
			</Text>

			{/* Business Page Badge - always visible */}
			{user.isBusinessPage && (
				<Box
					flexDirection="row"
					alignItems="center"
					backgroundColor="primary"
					paddingHorizontal="s"
					paddingVertical="xs"
					borderRadius="s"
					gap="xs"
				>
					<Ionicons name="briefcase-outline" size={14} color="white" />
					<Text variant="caption" color="primary-foreground" fontWeight="500">
						Business Page
					</Text>
				</Box>
			)}

			{/* Bio - always visible */}
			{user.bio && (
				<Text variant="body" textAlign="center" numberOfLines={3}>
					{user.bio}
				</Text>
			)}

			{/* Private profile message */}
			{isPrivateAndNotAccessible && (
				<Box
					backgroundColor="muted"
					padding="m"
					borderRadius="m"
					marginTop="m"
					width="100%"
				>
					<Text variant="body" textAlign="center" color="muted-foreground">
						This account is private
					</Text>
					<Text variant="caption" textAlign="center" marginTop="xs">
						Follow this user to see their posts and activity
					</Text>
				</Box>
			)}

			{/* Occupations - only show if not private or accessible */}
			{!isPrivateAndNotAccessible &&
				user.occupations &&
				user.occupations.length > 0 && (
					<Box
						flexDirection="row"
						flexWrap="wrap"
						justifyContent="center"
						gap="s"
					>
						{user.occupations.slice(0, 3).map((occupation) => (
							<Box
								key={occupation.id}
								backgroundColor="muted"
								paddingHorizontal="s"
								paddingVertical="xs"
								borderRadius="s"
							>
								<Text variant="caption">{occupation.name}</Text>
							</Box>
						))}
					</Box>
				)}
		</Box>
	);
}
