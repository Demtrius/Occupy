import { useTheme } from "@shopify/restyle";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
	Alert,
	FlatList,
	KeyboardAvoidingView,
	type ListRenderItem,
	Platform,
	type TextInput,
} from "react-native";
import { PostCard } from "@/components/cards/post-card";
import { CreatePostModal } from "@/components/clique/create-post-modal";
import type { ReplyContextSummary } from "@/components/post/comment-composer";
import { CommentComposer } from "@/components/post/comment-composer";
import { CommentItem } from "@/components/post/comment-item";
import { ErrorScreen } from "@/components/ui/error-screen";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Box, Text } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import type { Theme } from "@/config/theme";
import {
	useCreateCommentMutation,
	useDeletePostMutation,
	useGetPostQuery,
	useMeQuery,
} from "@/hooks";
import {
	type FlattenedThreadComment,
	useCommentThreads,
} from "@/hooks/use-comment-threads";
import { getErrorMessage } from "@/lib/error-utils";
import { presentOverflowMenu } from "@/lib/overflow-menu";
import { showToast } from "@/stores/toast-store";
import type { Comment, Post } from "@/types";

interface ReplyContextState extends ReplyContextSummary {
	commentId: string;
	mention: string;
}

export default function PostDetailPage() {
	const { id } = useLocalSearchParams<{ id?: string }>();
	const postId = id ?? "";
	const theme = useTheme<Theme>();
	const postQuery = useGetPostQuery(postId);
	const meQuery = useMeQuery();
	const createCommentMutation = useCreateCommentMutation();
	const deletePostMutation = useDeletePostMutation();
	const inputRef = useRef<TextInput | null>(null);
	const [commentBody, setCommentBody] = useState("");
	const [replyContext, setReplyContext] = useState<ReplyContextState | null>(
		null,
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [editingPost, setEditingPost] = useState<Post | null>(null);
	const currentUserId = meQuery.data?.id;

	const {
		comments: threadedComments,
		expandThread,
		toggleReplies,
	} = useCommentThreads(
		postQuery.data?.comments ? [...postQuery.data.comments] : [],
	);

	const handleSubmitComment = useCallback(async () => {
		const trimmed = commentBody.trim();
		if (!postId || !trimmed) {
			return;
		}

		const payload: { body: string; parentCommentId?: string | null } = {
			body: trimmed,
		};
		if (replyContext?.commentId) {
			payload.parentCommentId = replyContext.commentId;
		}

		try {
			await createCommentMutation.mutateAsync({
				params: { path: { postId } },
				body: payload,
			});
			setCommentBody("");
			setReplyContext(null);
			await postQuery.refetch();
			showToast({ type: "success", message: "Comment posted" });
		} catch (error: unknown) {
			showToast({
				type: "error",
				message: getErrorMessage(error, "Failed to post comment"),
			});
		}
	}, [commentBody, createCommentMutation, postId, postQuery, replyContext]);

	const handleReplyToComment = useCallback(
		(comment: Comment) => {
			const fullName = (comment.author?.fullName ?? "").trim();
			const username = (comment.author?.username ?? "").trim();
			const fallback = comment.author?.id ?? "";
			const baseName = fullName || username || fallback;
			const sanitized = baseName.replace(/\s+/g, "");
			if (!sanitized) {
				return;
			}

			const mention = `@${sanitized}`;
			const label = fullName || baseName;
			setReplyContext({ commentId: comment.id, mention, label });
			setCommentBody((prev) => {
				const withoutMention = prev.replace(/^@\S+\s*/, "").trimStart();
				return withoutMention.length > 0
					? `${mention} ${withoutMention}`
					: `${mention} `;
			});
			expandThread(comment.id);

			requestAnimationFrame(() => {
				const input = inputRef.current;
				if (!input) {
					return;
				}
				input.focus();
				const position = mention.length + 1;
				input.setNativeProps?.({
					selection: { start: position, end: position },
				});
			});
		},
		[expandThread],
	);

	const handleCancelReply = useCallback(() => {
		setReplyContext(null);
		setCommentBody((prev) => prev.replace(/^@\S+\s*/, "").trimStart());
		inputRef.current?.focus();
	}, []);

	const confirmDelete = useCallback(
		(post: Post) => {
			Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await deletePostMutation.mutateAsync({
								params: { path: { postId: post.id } },
							});
							showToast({
								type: "success",
								message: "Post deleted",
							});
							// Navigate back after successful deletion
							postQuery.refetch();
						} catch (error: unknown) {
							showToast({
								type: "error",
								message: getErrorMessage(error, "Failed to delete post"),
							});
						}
					},
				},
			]);
		},
		[deletePostMutation, postQuery],
	);

	const handleMenuPress = useCallback(
		(post: Post) => {
			presentOverflowMenu([
				{
					label: "Edit",
					onPress: () => {
						setModalMode("edit");
						setEditingPost(post);
						setIsModalOpen(true);
					},
				},
				{
					label: "Delete",
					destructive: true,
					onPress: () => confirmDelete(post),
				},
			]);
		},
		[confirmDelete],
	);

	const handleCloseModal = useCallback(() => {
		setIsModalOpen(false);
		setEditingPost(null);
	}, []);

	const handlePostUpdated = useCallback(
		(_post: Post) => {
			showToast({
				type: "success",
				message: "Post updated",
			});
			postQuery.refetch();
		},
		[postQuery],
	);

	const onRetry = () => {
		postQuery.refetch();
	};

	const composerContext = useMemo<ReplyContextSummary | null>(
		() => (replyContext ? { label: replyContext.label } : null),
		[replyContext],
	);

	if (!id) {
		return <ErrorScreen message="Post not found" onRetry={onRetry} />;
	}

	if (postQuery.isLoading) {
		return <LoadingScreen />;
	}

	if (postQuery.error || !postQuery.data) {
		return <ErrorScreen message="Failed to load post" onRetry={onRetry} />;
	}

	const renderCommentItem: ListRenderItem<FlattenedThreadComment> = ({
		item,
	}) => (
		<CommentItem
			comment={item.comment}
			depth={item.depth}
			replyLabel={item.replyLabel}
			totalReplies={item.totalReplies}
			isCollapsed={item.isCollapsed}
			isRoot={item.isRoot}
			isReplyTarget={replyContext?.commentId === item.comment.id}
			onReply={handleReplyToComment}
			onToggleReplies={item.isRoot ? toggleReplies : undefined}
		/>
	);

	return (
		<Screen noTopPadding>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={theme.spacing.xxl}
			>
				<Box flex={1}>
					<FlatList
						data={threadedComments}
						keyExtractor={(item) => item.comment.id}
						renderItem={renderCommentItem}
						ListHeaderComponent={
							<PostCard
								post={postQuery.data}
								variant="inline"
								isSelfRedirectable={false}
								canEdit={
									Boolean(currentUserId) &&
									(postQuery.data.authorUserId === currentUserId ||
										postQuery.data.author?.id === currentUserId)
								}
								onMenuPress={
									currentUserId &&
									(postQuery.data.authorUserId === currentUserId ||
										postQuery.data.author?.id === currentUserId)
										? () => handleMenuPress(postQuery.data)
										: undefined
								}
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
						extraData={{
							replyTo: replyContext?.commentId ?? null,
						}}
					/>
					<CommentComposer
						isSubmitting={createCommentMutation.isPending}
						value={commentBody}
						onChange={setCommentBody}
						onSubmit={handleSubmitComment}
						inputRef={inputRef}
						replyContext={composerContext}
						onCancelReply={handleCancelReply}
					/>
				</Box>
			</KeyboardAvoidingView>
			{editingPost?.cliqueId ? (
				<CreatePostModal
					visible={isModalOpen}
					cliqueId={editingPost.cliqueId}
					mode={modalMode}
					post={editingPost}
					onClose={handleCloseModal}
					onUpdated={handlePostUpdated}
				/>
			) : null}
		</Screen>
	);
}
