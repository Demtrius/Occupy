import { useTheme } from "@shopify/restyle";
import { memo, useMemo } from "react";
import { Pressable } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import { formatRelativeTimestamp } from "@/lib/date";
import type { Comment } from "@/types";

interface CommentItemProps {
	comment: Comment;
	depth: number;
	replyLabel?: string;
	totalReplies: number;
	isCollapsed: boolean;
	isRoot: boolean;
	isReplyTarget?: boolean;
	onReply?: (comment: Comment) => void;
	onToggleReplies?: (commentId: string) => void;
}

export const CommentItem = memo(function CommentItem({
	comment,
	depth,
	replyLabel,
	totalReplies,
	isCollapsed,
	isRoot,
	isReplyTarget = false,
	onReply,
	onToggleReplies,
}: CommentItemProps) {
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
	const hasReplies = totalReplies > 0;
	const indentStyle =
		depth > 0
			? {
					marginLeft: theme.spacing.l,
				}
			: undefined;

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
							{hasReplies && isRoot ? (
								<Pressable
									onPress={() => onToggleReplies?.(comment.id)}
									hitSlop={8}
								>
									<Text variant="caption" color="primary">
										{isCollapsed
											? `Show replies (${totalReplies})`
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
});
