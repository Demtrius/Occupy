import { useTheme } from "@shopify/restyle";
import { useLocalSearchParams } from "expo-router";
import {
	type RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Animated,
	Easing,
	FlatList,
	KeyboardAvoidingView,
	type ListRenderItem,
	Platform,
	Pressable,
	type TextInput,
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

interface ReplyContext {
	commentId: string;
	mention: string;
	label: string;
}

interface CommentNode {
	comment: Comment;
	replies: CommentNode[];
}

function getTotalReplyCount(node: CommentNode): number {
	let total = 0;
	const stack: CommentNode[] = [...node.replies];
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;
		total += 1;
		stack.push(...current.replies);
	}
	return total;
}

export default function PostDetailPage() {
	const { id } = useLocalSearchParams<{ id?: string }>();
	const postId = id ?? "";
	const theme = useTheme<Theme>();
	const postQuery = useGetPostQuery(postId);
	const createCommentMutation = useCreateCommentMutation();
	const [commentBody, setCommentBody] = useState("");
	// biome-ignore lint/style/noNonNullAssertion: <>
	const inputRef = useRef<TextInput>(null!);
	const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);
	const [collapsedThreadIds, setCollapsedThreadIds] = useState<Set<string>>(
		() => new Set(),
	);

	const sortedComments = useMemo<Comment[]>(() => {
		const list = postQuery.data?.comments ?? [];
		return [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	}, [postQuery.data?.comments]);

	const parentLookup = useMemo(() => {
		const map = new Map<string, string | null>();
		for (const comment of sortedComments) {
			map.set(comment.id, comment.parentCommentId ?? null);
		}
		return map;
	}, [sortedComments]);

	const commentTree = useMemo<CommentNode[]>(() => {
		const nodes = new Map<string, CommentNode>();
		for (const comment of sortedComments) {
			nodes.set(comment.id, { comment, replies: [] });
		}

		const roots: CommentNode[] = [];
		for (const comment of sortedComments) {
			const node = nodes.get(comment.id);
			if (!node) continue;

			const parentId = comment.parentCommentId;
			const parentNode = parentId ? nodes.get(parentId) : undefined;
			if (parentNode) {
				parentNode.replies.push(node);
			} else {
				roots.push(node);
			}
		}

		return roots;
	}, [sortedComments]);

	const commentById = useMemo(() => {
		const map = new Map<string, Comment>();
		for (const comment of sortedComments) {
			map.set(comment.id, comment);
		}
		return map;
	}, [sortedComments]);

	const replyLabelLookup = useMemo(() => {
		const map = new Map<string, string>();
		for (const comment of sortedComments) {
			const parentId = comment.parentCommentId;
			if (!parentId) continue;
			const parent = commentById.get(parentId);
			if (!parent) continue;

			const parentFullName = (parent.author?.fullName ?? "").trim();
			const parentUsername = (parent.author?.username ?? "").trim();
			const fallback = parent.author?.id ?? "";
			const label = parentFullName || parentUsername || fallback;
			if (label) {
				map.set(comment.id, label);
			}
		}
		return map;
	}, [commentById, sortedComments]);

	interface FlattenedComment {
		node: CommentNode;
		depth: number;
		replyLabel?: string;
	}

	useEffect(() => {
		setCollapsedThreadIds((prev) => {
			if (prev.size > 0) {
				return prev;
			}

			let changed = false;
			const next = new Set(prev);
			for (const node of commentTree) {
				if (node.replies.length > 0 && !next.has(node.comment.id)) {
					next.add(node.comment.id);
					changed = true;
				}
			}

			return changed ? next : prev;
		});
	}, [commentTree]);

	const flattenedComments = useMemo<FlattenedComment[]>(() => {
		const items: FlattenedComment[] = [];

		const visit = (node: CommentNode, depth: number) => {
			const replyLabel = replyLabelLookup.get(node.comment.id);
			items.push({ node, depth, replyLabel });
			if (collapsedThreadIds.has(node.comment.id)) {
				return;
			}
			for (const child of node.replies) {
				visit(child, depth + 1);
			}
		};

		for (const root of commentTree) {
			visit(root, 0);
		}

		return items;
	}, [collapsedThreadIds, commentTree, replyLabelLookup]);

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
			setCollapsedThreadIds((prev) => {
				const next = new Set(prev);
				let currentId: string | null = comment.id;
				while (currentId) {
					next.delete(currentId);
					currentId = parentLookup.get(currentId) ?? null;
				}
				return next;
			});
			setCommentBody((prev) => {
				const withoutMention = prev.replace(/^@\S+\s*/, "").trimStart();
				return withoutMention.length > 0
					? `${mention} ${withoutMention}`
					: `${mention} `;
			});

			setTimeout(() => {
				const input = inputRef.current;
				if (!input) {
					return;
				}
				input.focus();
				const position = mention.length + 1;
				input.setNativeProps?.({
					selection: { start: position, end: position },
				});
			}, 80);
		},
		[parentLookup],
	);

	const handleCancelReply = useCallback(() => {
		setReplyContext(null);
		setCommentBody((prev) => prev.replace(/^@\S+\s*/, ""));
		inputRef.current?.focus();
	}, []);

	const handleToggleReplies = useCallback((commentId: string) => {
		setCollapsedThreadIds((prev) => {
			const next = new Set(prev);
			if (next.has(commentId)) {
				next.delete(commentId);
			} else {
				next.add(commentId);
			}
			return next;
		});
	}, []);

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

	const renderCommentItem: ListRenderItem<FlattenedComment> = ({ item }) => {
		const { node, depth, replyLabel } = item;
		const totalReplies = node.replies.length > 0 ? getTotalReplyCount(node) : 0;
		return (
			<CommentItem
				comment={node.comment}
				depth={depth}
				replyLabel={replyLabel}
				isReplyTarget={replyContext?.commentId === node.comment.id}
				onReply={handleReplyToComment}
				onToggleReplies={
					node.replies.length > 0 ? handleToggleReplies : undefined
				}
				isCollapsed={collapsedThreadIds.has(node.comment.id)}
				replyCount={totalReplies}
			/>
		);
	};

	return (
		<Screen noTopPadding>
			<KeyboardAvoidingView
				style={{
					flex: 1,
					paddingTop: theme.spacing.m,
					paddingHorizontal: theme.spacing.s,
				}}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={theme.spacing.xxl}
			>
				<Box flex={1}>
					<FlatList
						data={flattenedComments}
						keyExtractor={(item) => item.node.comment.id}
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
						extraData={{
							replyTo: replyContext?.commentId ?? null,
							collapsed: Array.from(collapsedThreadIds),
						}}
					/>
					<CommentComposer
						isSubmitting={createCommentMutation.isPending}
						value={commentBody}
						onChange={setCommentBody}
						onSubmit={handleSubmitComment}
						inputRef={inputRef}
						replyContext={replyContext}
						onCancelReply={handleCancelReply}
					/>
				</Box>
			</KeyboardAvoidingView>
		</Screen>
	);
}

function CommentItem({
	comment,
	onReply,
	isReplyTarget = false,
	depth = 0,
	onToggleReplies,
	isCollapsed = false,
	replyCount = 0,
	replyLabel,
}: {
	comment: Comment;
	onReply?: (comment: Comment) => void;
	isReplyTarget?: boolean;
	depth?: number;
	onToggleReplies?: (commentId: string) => void;
	isCollapsed?: boolean;
	replyCount?: number;
	replyLabel?: string;
}) {
	const theme = useTheme<Theme>();
	const timestamp = useMemo(
		() =>
			formatRelativeTimestamp(comment.createdAt, {
				includeJustNow: true,
			}),
		[comment.createdAt],
	);

	const displayName =
		comment.author?.fullName ?? comment.author?.username ?? "Unknown User";

	const mentionMatch = comment.body.match(/^(@\S+)\s*/);
	const mentionText = mentionMatch?.[1];
	const remainingText = mentionText
		? comment.body.slice(mentionText.length).trimStart()
		: comment.body;
	const mentionDisplay = replyLabel ? `@${replyLabel}` : mentionText;
	const hasReplies = replyCount > 0;
	const indentStyle =
		depth > 0
			? {
					marginLeft: theme.spacing.l,
				}
			: undefined;
	const isRootComment = !comment.parentCommentId;

	return (
		<Box paddingBottom="m" marginHorizontal="s">
			<Box style={indentStyle}>
				<Box
					flexDirection="row"
					padding="s"
					borderRadius="m"
					marginBottom="s"
					backgroundColor={isReplyTarget ? "secondary" : undefined}
					borderWidth={isReplyTarget ? 1 : 0}
					borderColor={isReplyTarget ? "primary" : "transparent"}
				>
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
							{mentionText ? (
								<>
									<Text variant="body" color="primary" fontWeight="600">
										{mentionDisplay}
									</Text>
									{remainingText ? ` ${remainingText}` : ""}
								</>
							) : (
								comment.body
							)}
						</Text>
						<Box flexDirection="row" marginTop="s" gap="m" alignItems="center">
							<Pressable onPress={() => onReply?.(comment)} hitSlop={8}>
								<Text variant="caption" color="primary" fontWeight="600">
									Reply
								</Text>
							</Pressable>
							{hasReplies && isRootComment ? (
								<Pressable
									onPress={() => onToggleReplies?.(comment.id)}
									hitSlop={8}
								>
									<Text variant="caption" color="primary">
										{isCollapsed
											? `Show replies (${replyCount})`
											: `Hide replies`}
									</Text>
								</Pressable>
							) : null}
						</Box>
					</Box>
				</Box>
				<Box height={1} backgroundColor="border" />
			</Box>
		</Box>
	);
}

function CommentComposer({
	value,
	onChange,
	onSubmit,
	isSubmitting,
	inputRef,
	replyContext,
	onCancelReply,
}: {
	value: string;
	onChange: (next: string) => void;
	onSubmit: () => void;
	isSubmitting: boolean;
	inputRef: RefObject<TextInput>;
	replyContext: ReplyContext | null;
	onCancelReply: () => void;
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
			<Text variant="subheader">
				{replyContext ? "Add a reply" : "Leave a comment"}
			</Text>
			{replyContext ? (
				<Box
					flexDirection="row"
					alignItems="center"
					justifyContent="space-between"
				>
					<Text variant="caption" color="primary" fontWeight="600">
						@{replyContext.label}
					</Text>
					<Pressable onPress={onCancelReply} hitSlop={8}>
						<Text variant="caption" color="muted-foreground">
							Cancel
						</Text>
					</Pressable>
				</Box>
			) : null}
			<Animated.View
				style={{
					height: animatedHeight,
					width: "100%",
				}}
			>
				<Input
					ref={inputRef}
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
