import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type GestureResponderEvent, Pressable } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import { useLikePostMutation, useUnlikePostMutation } from "@/hooks";
import { formatRelativeTimestamp } from "@/lib/date";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type { Post } from "@/types";

interface PostCardProps {
	post: Post;
	isSelfRedirectable?: boolean;
}

export function PostCard({
	post,
	variant = "elevated",
	isSelfRedirectable = true,
}: PostCardProps & React.ComponentProps<typeof Card>) {
	const router = useRouter();
	const theme = useTheme<Theme>();
	const likeMutation = useLikePostMutation();
	const unlikeMutation = useUnlikePostMutation();

	const [isLiked, setIsLiked] = useState(post.likedByMe);
	const [likesCount, setLikesCount] = useState(post.likesCount);

	const mediaItems = useMemo(() => {
		const items = post.media ?? [];
		return [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
	}, [post.media]);

	const primaryMedia = mediaItems[0];
	const additionalMediaCount =
		mediaItems.length > 1 ? mediaItems.length - 1 : 0;

	useEffect(() => {
		setIsLiked(post.likedByMe);
	}, [post.likedByMe]);

	useEffect(() => {
		setLikesCount(post.likesCount);
	}, [post.likesCount]);

	const timestampLabel = useMemo(
		() =>
			formatRelativeTimestamp(post.createdAt, {
				hourDisplay: "short",
			}),
		[post.createdAt],
	);

	const isMutating = likeMutation.isPending || unlikeMutation.isPending;

	const handleNavigateToPost = useCallback(() => {
		if (!isSelfRedirectable) return;

		router.push({ pathname: "/posts/[id]", params: { id: post.id } });
	}, [isSelfRedirectable, post.id, router]);

	const handleCliquePress = useCallback(
		(event: GestureResponderEvent) => {
			event.stopPropagation();

			const cliqueId = post.clique?.id ?? post.cliqueId;
			if (!cliqueId) return;

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
			if (!authorId) return;

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
					setLikesCount((prev) => updated?.likesCount ?? Math.max(prev - 1, 0));
				} else {
					const updated = await likeMutation.mutateAsync({
						params: { path: { postId: post.id } },
					});
					setIsLiked(true);
					setLikesCount((prev) => updated?.likesCount ?? prev + 1);
				}
			} catch (error: unknown) {
				showToast({
					type: "error",
					message: getErrorMessage(error, "Failed to update like"),
				});
			}
		},
		[isLiked, isMutating, likeMutation, post.id, unlikeMutation],
	);

	return (
		<Box marginBottom="m">
			<Pressable
				onPress={handleNavigateToPost}
				style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
			>
				<Card variant={variant}>
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

					{primaryMedia?.media?.url ? (
						<Box marginBottom="m">
							<Box
								height={220}
								borderRadius="l"
								overflow="hidden"
								backgroundColor="muted"
							>
								<Image
									source={{ uri: primaryMedia.media.url }}
									style={{ width: "100%", height: "100%" }}
									contentFit="cover"
								/>
								{additionalMediaCount > 0 ? (
									<Box
										position="absolute"
										paddingHorizontal="s"
										paddingVertical="xs"
										borderRadius="m"
										style={{
											backgroundColor: "rgba(0,0,0,0.55)",
											right: theme.spacing.s,
											top: theme.spacing.s,
										}}
									>
										<Text
											variant="caption"
											color="primary-foreground"
											fontWeight="600"
										>
											+{additionalMediaCount}
										</Text>
									</Box>
								) : null}
							</Box>
						</Box>
					) : null}

					{/* Post Content */}
					<Text variant="body">{post.content}</Text>

					{/* Post Stats */}
					<Box
						marginTop="m"
						paddingTop="m"
						paddingHorizontal={variant === "inline" ? "s" : undefined}
						paddingBottom="s"
						flexDirection="row"
						alignItems="center"
						borderTopColor="border"
						borderTopWidth={1}
					>
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
						<Box flexDirection="row" alignItems="center" marginLeft="m">
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
