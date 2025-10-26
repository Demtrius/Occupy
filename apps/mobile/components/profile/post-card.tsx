import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Avatar } from "@/components/ui/avatar";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Post } from "@/types";

interface PostCardProps {
	post: Post;
}

export function PostCard({ post }: PostCardProps) {
	const theme = useTheme<Theme>();
	return (
		<Card variant="elevated" marginBottom="m">
			{/* Post Header */}
			<Box flexDirection="row" alignItems="center" marginBottom="s">
				<Avatar size={32} />
				<Box marginLeft="s" flex={1}>
					<Text variant="body" fontWeight="600">
						Post Author
					</Text>
					<Text variant="caption" color="muted-foreground">
						{new Date(post.createdAt).toLocaleDateString()}
					</Text>
				</Box>
			</Box>

			{/* Post Content */}
			<Text variant="body" marginBottom="s" numberOfLines={3}>
				{post.content}
			</Text>

			{/* Post Image Placeholder */}
			{post.imageUrl && (
				<Box
					height={150}
					backgroundColor="muted"
					borderRadius="l"
					marginBottom="s"
					alignItems="center"
					justifyContent="center"
				>
					<Text variant="caption" color="muted-foreground">
						Image: {post.imageUrl}
					</Text>
				</Box>
			)}

			{/* Post Stats */}
			<Box flexDirection="row" alignItems="center">
				<Box flexDirection="row" alignItems="center" marginRight="m">
					<Ionicons
						name="heart-outline"
						size={16}
						color={theme.colors["muted-foreground"]}
					/>
					<Text variant="caption" color="muted-foreground" marginLeft="xs">
						{post.likesCount}
					</Text>
				</Box>
				<Box flexDirection="row" alignItems="center">
					<Ionicons
						name="chatbubble-outline"
						size={16}
						color={theme.colors["muted-foreground"]}
					/>
					<Text variant="caption" color="muted-foreground" marginLeft="xs">
						{post.commentsCount}
					</Text>
				</Box>
			</Box>
		</Card>
	);
}
