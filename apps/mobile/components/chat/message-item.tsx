import { useTheme } from "@shopify/restyle";
import React from "react";
import { Image, Pressable } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Message, User } from "@/types";

interface MessageItemProps {
	item: Message;
	index: number;
	messages: Message[];
	isMe: boolean;
	partner?: User;
	sendingMessageIds: Set<string>;
	onAvatarPress: (userId: string) => void;
	screenWidth: number;
}

// Memoize expensive calculations
const shouldShowAvatar = (
	index: number,
	messages: Message[],
	item: Message,
) => {
	// Since FlatList is inverted, index 0 is newest message
	// Show avatar if this is newest message (index 0) or previous message is from different user
	const isNewestMessage = index === 0;
	const previousMessage = messages[index - 1];
	const previousIsDifferentUser =
		previousMessage && previousMessage.senderUserId !== item.senderUserId;

	return isNewestMessage || previousIsDifferentUser;
};

// Extract message status logic outside render
const getMessageStatus = (
	item: Message,
	isMe: boolean,
	sendingMessageIds: Set<string>,
) => {
	if (!isMe) return null; // Don't show status for other people's messages

	if (sendingMessageIds.has(item.id)) {
		return "Sending...";
	}

	if (item.readAt) {
		return "Seen";
	}

	return "Sent";
};

export const MessageItem = ({
	item,
	index,
	messages,
	isMe,
	partner,
	sendingMessageIds,
	onAvatarPress,
	screenWidth,
}: MessageItemProps) => {
	const theme = useTheme<Theme>();
	const isLatest = index === 0;
	const showAvatar = shouldShowAvatar(index, messages, item);
	const messageStatus = getMessageStatus(item, isMe, sendingMessageIds);
	const maxImageWidth = screenWidth * 0.6; // 60% of screen width for images

	// Calculate image dimensions
	const calculateImageDimensions = () => {
		if (!item.media?.meta?.width) {
			return { width: 200, height: 200 };
		}

		const width = Math.min(maxImageWidth, item.media.meta.width as number);
		const aspectRatio =
			(item.media.meta.height as number) / (item.media.meta.width as number);
		const height = width * aspectRatio;

		return { width, height };
	};

	const imageDimensions = calculateImageDimensions();

	return (
		<Box key={item.id} marginBottom="s">
			{isMe ? (
				<Box flexDirection="row" justifyContent="flex-end" marginBottom="xs">
					<Box maxWidth="80%" alignItems="flex-end">
						<Box
							backgroundColor="primary"
							padding={item.media?.url ? "xs" : "m"}
							borderRadius="l"
							borderBottomRightRadius="s"
						>
							{item.mediaId && item.media?.url ? (
								<Box>
									<Pressable
										onPress={() => {
											// Image pressed handler
										}}
									>
										<Image
											source={{ uri: item.media.url }}
											style={{
												width: imageDimensions.width,
												height: imageDimensions.height,
												borderRadius: 12,
												borderBottomRightRadius: 4,
												marginBottom: item.body ? 4 : 0,
											}}
											resizeMode="cover"
										/>
									</Pressable>
									{item.body ? (
										<Text color="primary-foreground" marginTop="s">
											{item.body}
										</Text>
									) : null}
								</Box>
							) : item.body ? (
								<Text color="primary-foreground">{item.body}</Text>
							) : null}
						</Box>
						{isLatest && messageStatus ? (
							<Text
								variant="caption"
								color="muted-foreground"
								alignSelf="flex-end"
								marginTop="xs"
							>
								{messageStatus}
							</Text>
						) : null}
					</Box>
				</Box>
			) : (
				<Box flexDirection="row" alignItems="flex-end" maxWidth="80%">
					{showAvatar ? (
						<Pressable
							onPress={() =>
								item.senderUserId && onAvatarPress(item.senderUserId)
							}
							style={{
								marginBottom: isLatest ? theme.spacing.l : theme.spacing.xs,
							}}
						>
							<Avatar
								size={32}
								source={
									partner?.profileImageUrl
										? { uri: partner.profileImageUrl }
										: undefined
								}
								fallback={partner?.fullName?.[0]?.toUpperCase()}
							/>
						</Pressable>
					) : null}
					<Box style={{ marginLeft: showAvatar ? theme.spacing.s : 40 }}>
						<Box
							backgroundColor="muted"
							padding={item.media?.url ? "xs" : "m"}
							borderRadius="l"
							borderBottomLeftRadius="s"
						>
							{item.mediaId && item.media?.url ? (
								<Box>
									<Pressable
										onPress={() => {
											// Image pressed handler
										}}
									>
										<Image
											source={{ uri: item.media.url }}
											style={{
												width: imageDimensions.width,
												height: imageDimensions.height,
												borderRadius: 12,
												borderBottomLeftRadius: 4,
												marginBottom: item.body ? 4 : 0,
											}}
											resizeMode="cover"
										/>
									</Pressable>
									{item.body ? (
										<Text color="foreground" marginTop="s">
											{item.body}
										</Text>
									) : null}
								</Box>
							) : item.body ? (
								<Text color="foreground">{item.body}</Text>
							) : null}
						</Box>
						{isLatest ? (
							<Text variant="caption" color="muted-foreground" marginTop="xs">
								{item.readAt ? "Seen" : "Sent"}
							</Text>
						) : null}
					</Box>
				</Box>
			)}
		</Box>
	);
};

export const MessageItemMemo = React.memo(
	MessageItem,
	(prevProps, nextProps) => {
		// Custom comparison function to optimize re-renders
		const itemEqual =
			prevProps.item.id === nextProps.item.id &&
			prevProps.item.body === nextProps.item.body &&
			prevProps.item.media?.url === nextProps.item.media?.url &&
			prevProps.item.readAt === nextProps.item.readAt &&
			prevProps.item.mediaId === nextProps.item.mediaId;

		const propsEqual =
			prevProps.isMe === nextProps.isMe &&
			prevProps.index === nextProps.index &&
			prevProps.screenWidth === nextProps.screenWidth &&
			prevProps.sendingMessageIds.size === nextProps.sendingMessageIds.size &&
			(prevProps.sendingMessageIds.size === 0 ||
				Array.from(prevProps.sendingMessageIds).every((id) =>
					nextProps.sendingMessageIds.has(id),
				));

		return itemEqual && propsEqual;
	},
);
