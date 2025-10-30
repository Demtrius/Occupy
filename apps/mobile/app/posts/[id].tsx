import { useTheme } from "@shopify/restyle";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Animated,
	Easing,
	FlatList,
	KeyboardAvoidingView,
	type ListRenderItem,
	Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "@/components/cards/post-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Box, Text } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import type { Theme } from "@/config/theme";
import { useCreateCommentMutation, useGetPostQuery } from "@/hooks";
import { formatRelativeTimestamp } from "@/lib/date";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type { Comment } from "@/types";

export default function PostDetailPage() {
	const { id } = useLocalSearchParams<{ id?: string }>();
	const postId = id ?? "";
	const theme = useTheme<Theme>();
	const postQuery = useGetPostQuery(postId);
	const createCommentMutation = useCreateCommentMutation();
	const [commentBody, setCommentBody] = useState("");
	const comments = useMemo<Comment[]>(() => {
		const list = postQuery.data?.comments ?? [];
		return [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	}, [postQuery.data?.comments]);

	const handleSubmitComment = useCallback(async () => {
		if (!postId || !commentBody.trim()) {
			return;
		}
		try {
			await createCommentMutation.mutateAsync({
				params: { path: { postId } },
				body: { body: commentBody.trim() },
			});
			setCommentBody("");
			await postQuery.refetch();
			showToast({ type: "success", message: "Comment posted" });
		} catch (error: unknown) {
			showToast({
				type: "error",
				message: getErrorMessage(error, "Failed to post comment"),
			});
		}
	}, [commentBody, createCommentMutation, postId, postQuery]);

	const onRetry = () => {
		postQuery.refetch();
	};

	if (!id) {
		return <ErrorScreen message="Post not found" onRetry={onRetry} />;
	}

	if (postQuery.isLoading) {
		return <LoadingScreen />;
	}

	if (postQuery.error || !postQuery.data) {
		return <ErrorScreen message="Failed to load post" onRetry={onRetry} />;
	}

	const post = postQuery.data;

	const renderCommentItem: ListRenderItem<Comment> = ({ item }) => (
		<CommentItem comment={item} />
	);

	return (
		<Screen noTopPadding>
			<KeyboardAvoidingView
				style={{
					flex: 1,
					paddingInline: 0,
				}}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={theme.spacing.xxxl}
			>
				<Box flex={1}>
					<FlatList
						data={comments}
						keyExtractor={(item) => item.id}
						renderItem={renderCommentItem}
						ListHeaderComponent={
							<PostCard
								post={post}
								variant="inline"
								isSelfRedirectable={false}
							/>
						}
						ListEmptyComponent={
							<Box paddingHorizontal="m" paddingVertical="l">
								<Text variant="body" color="muted-foreground">
									Be the first to comment on this post.
								</Text>
							</Box>
						}
						contentContainerStyle={{
							paddingBottom: theme.spacing.m,
						}}
						showsVerticalScrollIndicator={false}
						style={{ flex: 1 }}
					/>
					<CommentComposer
						isSubmitting={createCommentMutation.isPending}
						value={commentBody}
						onChange={setCommentBody}
						onSubmit={handleSubmitComment}
					/>
				</Box>
			</KeyboardAvoidingView>
		</Screen>
	);
}

function CommentItem({ comment }: { comment: Comment }) {
	const timestamp = useMemo(
		() =>
			formatRelativeTimestamp(comment.createdAt, {
				includeJustNow: true,
			}),
		[comment.createdAt],
	);

	const displayName =
		comment.author?.fullName ?? comment.author?.username ?? "Unknown User";

	return (
		<Box paddingBottom="m" marginHorizontal="m">
			<Box flexDirection="row">
				<Avatar
					size={32}
					source={
						comment.author?.profileImageUrl
							? { uri: comment.author.profileImageUrl }
							: undefined
					}
					fallback={displayName.charAt(0)?.toUpperCase()}
				/>
				<Box marginLeft="s" flex={1}>
					<Box
						flexDirection="row"
						justifyContent="space-between"
						marginBottom="xs"
					>
						<Text variant="body" fontWeight="600">
							{displayName}
						</Text>
						<Text variant="caption" color="muted-foreground">
							{timestamp}
						</Text>
					</Box>
					<Text variant="body" color="foreground">
						{comment.body}
					</Text>
				</Box>
			</Box>
			<Box height={1} backgroundColor="border" marginTop="m" />
		</Box>
	);
}

function CommentComposer({
	value,
	onChange,
	onSubmit,
	isSubmitting,
}: {
	value: string;
	onChange: (next: string) => void;
	onSubmit: () => void;
	isSubmitting: boolean;
}) {
	const theme = useTheme<Theme>();
	const insets = useSafeAreaInsets();
	const bottomInset = Math.max(insets.bottom, theme.spacing.s);
	const paddingBottom = theme.spacing.m + bottomInset;
	const [isFocused, setIsFocused] = useState(false);
	const collapsedHeight = 56;
	const expandedHeight = 120;
	const animatedHeight = useRef(new Animated.Value(collapsedHeight)).current;

	useEffect(() => {
		Animated.timing(animatedHeight, {
			toValue: isFocused ? expandedHeight : collapsedHeight,
			duration: 250,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: false,
		}).start();
	}, [animatedHeight, isFocused]);

	return (
		<Box
			paddingTop="m"
			borderRadius="xl"
			paddingHorizontal="m"
			borderWidth={1}
			borderColor="border"
			borderBottomColor="background"
			backgroundColor="background"
			gap="m"
			shadowColor="ring"
			shadowOffset={{
				width: 0,
				height: -1,
			}}
			shadowOpacity={0.25}
			shadowRadius={8}
			elevation={5}
			style={{ paddingBottom }}
		>
			<Text variant="subheader">Leave a comment</Text>
			<Animated.View
				style={{
					height: animatedHeight,
					width: "100%",
				}}
			>
				<Input
					value={value}
					onChangeText={onChange}
					placeholder="Share your thoughts..."
					multiline
					numberOfLines={isFocused ? 5 : 2}
					textAlignVertical="top"
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					style={{
						paddingTop: theme.spacing.s,
						height: "100%",
						flex: 1,
					}}
					editable={!isSubmitting}
				/>
			</Animated.View>
			<Button onPress={onSubmit} disabled={isSubmitting || !value.trim()}>
				{isSubmitting ? "Posting..." : "Post Comment"}
			</Button>
		</Box>
	);
}
