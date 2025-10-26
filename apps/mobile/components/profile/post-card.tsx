import { Avatar } from "@/components/ui/avatar";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Post } from "@/types";

interface PostCardProps {
	post: Post;
	onPress?: () => void;
}

export function PostCard({ post, onPress }: PostCardProps) {
	return (
		<Box
			backgroundColor="card"
			borderRadius="m"
			padding="m"
			marginBottom="s"
			borderWidth={1}
			borderColor="border"
		>
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
					borderRadius="s"
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
			<Box flexDirection="row" justifyContent="space-between">
				<Text variant="caption" color="muted-foreground">
					❤️ {post.likesCount} likes
				</Text>
				<Text variant="caption" color="muted-foreground">
					💬 {post.commentsCount} comments
				</Text>
			</Box>
		</Box>
	);
}
