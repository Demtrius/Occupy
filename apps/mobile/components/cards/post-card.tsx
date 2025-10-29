import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { Pressable, type GestureResponderEvent } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import { useLikePostMutation, useUnlikePostMutation } from "@/hooks";
import { showToast } from "@/stores/toast-store";
import type { Post } from "@/types";

interface PostCardProps {
	post: Post;
}

export function PostCard({ post }: PostCardProps) {
	const router = useRouter();
	const theme = useTheme<Theme>();
	const likeMutation = useLikePostMutation();
	const unlikeMutation = useUnlikePostMutation();

	const [isLiked, setIsLiked] = useState(post.likedByMe);
	const [likesCount, setLikesCount] = useState(post.likesCount);

	useEffect(() => {
		setIsLiked(post.likedByMe);
	}, [post.likedByMe]);

	useEffect(() => {
		setLikesCount(post.likesCount);
	}, [post.likesCount]);

	const timestampLabel = useMemo(
		() => formatPostTimestamp(post.createdAt),
		[post.createdAt],
	);

	const isMutating = likeMutation.isPending || unlikeMutation.isPending;

	const handleNavigateToPost = useCallback(() => {
		router.push({ pathname: "/posts/[id]", params: { id: post.id } });
	}, [post.id, router]);

	const handleCliquePress = useCallback(
		(event: GestureResponderEvent) => {
			event.stopPropagation();
			const cliqueId = post.clique?.id ?? post.cliqueId;
			if (!cliqueId) {
				return;
			}
			router.push({
				pathname: "/cliques/[id]",
				params: { id: cliqueId },
			});
		},
		[post.clique?.id, post.cliqueId, router],
	);

	const handleAuthorPress = useCallback(
		(event: GestureResponderEvent) => {
			event.stopPropagation();
			const authorId = post.author?.id ?? post.authorUserId;
			if (!authorId) {
				return;
			}
			router.push({
				pathname: "/(tabs)/profile",
				params: { userId: authorId },
			});
		},
		[post.author?.id, post.authorUserId, router],
	);

	const handleLikeToggle = useCallback(
		async (event: GestureResponderEvent) => {
			event.stopPropagation();
			if (isMutating) return;

			try {
				if (isLiked) {
					const updated = await unlikeMutation.mutateAsync({
						params: { path: { postId: post.id } },
					});
					setIsLiked(false);
					setLikesCount((prev) =>
						updated?.likesCount ?? Math.max(prev - 1, 0),
					);
				} else {
					const updated = await likeMutation.mutateAsync({
						params: { path: { postId: post.id } },
					});
					setIsLiked(true);
					setLikesCount((prev) => updated?.likesCount ?? prev + 1);
				}
			} catch (error: any) {
				showToast({
					type: "error",
					message: error?.message ?? "Failed to update like",
				});
			}
		},
		[
			isLiked,
			isMutating,
			likeMutation,
			post.id,
			showToast,
			unlikeMutation,
		],
	);

	return (
		<Box marginBottom="m">
			<Pressable
				onPress={handleNavigateToPost}
				style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
			>
				<Card variant="elevated">
					{/* Post Header */}
					<Box
						flexDirection="row"
						alignItems="center"
						justifyContent="space-between"
						marginBottom="m"
					>
						<Pressable
							onPress={handleCliquePress}
							hitSlop={8}
							style={({ pressed }) => [
								{
									opacity: pressed ? 0.8 : 1,
								},
							]}
						>
							<Box
								paddingHorizontal="s"
								paddingVertical="xs"
								borderRadius="m"
								backgroundColor="secondary"
							>
								<Text
									variant="caption"
									color="secondary-foreground"
									fontWeight="600"
									numberOfLines={1}
								>
									{post.clique?.name ?? "Unknown Clique"}
								</Text>
							</Box>
						</Pressable>
						<Pressable
							onPress={(event) => {
								event.stopPropagation();
								// TODO: Implement overflow menu actions.
							}}
							hitSlop={8}
							style={({ pressed }) => [
								{
									opacity: pressed ? 0.6 : 1,
									padding: theme.spacing.xs,
								},
							]}
						>
							<Ionicons
								name="ellipsis-horizontal"
								size={18}
								color={theme.colors["muted-foreground"]}
							/>
						</Pressable>
					</Box>

					{/* Author Info */}
					<Box
						flexDirection="row"
						alignItems="center"
						justifyContent="space-between"
						marginBottom="m"
					>
						<Pressable
							onPress={handleAuthorPress}
							hitSlop={8}
							style={({ pressed }) => [
								{
									flexDirection: "row",
									alignItems: "center",
									opacity: pressed ? 0.8 : 1,
									flex: 1,
								},
							]}
						>
							<Avatar
								size={40}
								source={
									post.author?.profileImageUrl
										? { uri: post.author.profileImageUrl }
										: undefined
								}
								fallback={post.author?.fullName?.charAt(0)?.toUpperCase()}
							/>
							<Box marginLeft="s" flex={1}>
								<Text variant="body" fontWeight="600" numberOfLines={1}>
									{post.author?.fullName ?? "Unknown User"}
								</Text>
							</Box>
						</Pressable>
						<Text variant="caption" color="muted-foreground" marginLeft="m">
							{timestampLabel}
						</Text>
					</Box>

					{/* Post Content */}
					<Text variant="body" marginBottom="m">
						{post.content}
					</Text>

					{/* Post Stats */}
					<Box flexDirection="row" alignItems="center">
						<Pressable
							onPress={handleLikeToggle}
							hitSlop={8}
							disabled={isMutating}
							style={({ pressed }) => [
								{
									flexDirection: "row",
									alignItems: "center",
									opacity: isMutating ? 0.6 : pressed ? 0.8 : 1,
								},
							]}
						>
							<Ionicons
								name={isLiked ? "heart" : "heart-outline"}
								size={18}
								color={
									isLiked
										? theme.colors.primary
										: theme.colors["muted-foreground"]
								}
							/>
							<Text variant="caption" color="muted-foreground" marginLeft="xs">
								{likesCount}
							</Text>
						</Pressable>
						<Box
							flexDirection="row"
							alignItems="center"
							marginLeft="m"
						>
							<Ionicons
								name="chatbubble-outline"
								size={18}
								color={theme.colors["muted-foreground"]}
							/>
							<Text variant="caption" color="muted-foreground" marginLeft="xs">
								{post.commentsCount}
							</Text>
						</Box>
					</Box>
				</Card>
			</Pressable>
		</Box>
	);
}

function formatPostTimestamp(createdAt: string): string {
	const created = new Date(createdAt);
	if (Number.isNaN(created.getTime())) {
		return "";
	}

	const now = new Date();
	const diffMs = now.getTime() - created.getTime();
	if (diffMs < 0) {
		return created.toLocaleDateString();
	}

	const diffMinutes = Math.floor(diffMs / 60000);
	if (diffMinutes < 60) {
		const minutes = Math.max(diffMinutes, 1);
		return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
	}

	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}

	return created.toLocaleDateString();
}
