import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Alert,
	Dimensions,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	Pressable,
} from "react-native";
import { MessageItem } from "@/components/chat/message-item";
import { Avatar } from "@/components/ui/avatar";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Box, Text } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import type { Theme } from "@/config/theme";
import { useDebounce } from "@/hooks";
import {
	usePresignUploadMutation,
	useRegisterUploadedMutation,
} from "@/hooks/use-media";
import {
	useListChatsQuery,
	useListMessagesQuery,
	useMarkMessagesReadMutation,
	useSendMessageMutation,
} from "@/hooks/use-messaging";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { useMeQuery, useUserQuery } from "@/hooks/use-users";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Chat } from "@/types";

// Chat header component
function ChatHeader({
	partner,
	onAvatarPress,
}: {
	partner:
		| { id?: string; fullName?: string; profileImageUrl?: string | null }
		| undefined;
	onAvatarPress: () => void;
}) {
	return (
		<Box
			padding="m"
			backgroundColor="background"
			borderBottomWidth={1}
			borderBottomColor="border"
		>
			<Box flexDirection="row" alignItems="center">
				<BackButton />
				<Box flexDirection="row" alignItems="center" flex={1} marginLeft="m">
					<Pressable onPress={onAvatarPress}>
						<Avatar
							size={40}
							source={
								partner?.profileImageUrl
									? { uri: partner.profileImageUrl }
									: undefined
							}
							fallback={partner?.fullName?.[0]?.toUpperCase()}
						/>
					</Pressable>
					<Box flex={1} marginLeft="s">
						<Text variant="small-header" numberOfLines={1}>
							{partner?.fullName || "Unknown"}
						</Text>
					</Box>
				</Box>
			</Box>
		</Box>
	);
}

export default function Page() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const theme = useTheme<Theme>();
	const chatId = id as string;
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useListMessagesQuery(chatId);
	const messages = data?.pages.flat();
	const { data: chats } = useListChatsQuery();
	const { data: me } = useMeQuery();
	const meIdRef = useRef<string | undefined>(me?.id?.toString());

	// Update ref when me changes
	useEffect(() => {
		if (me?.id) {
			meIdRef.current = me.id.toString();
		}
	}, [me?.id]);
	const sendMutation = useSendMessageMutation();
	const markReadMutation = useMarkMessagesReadMutation();
	const presignMutation = usePresignUploadMutation();
	const registerMutation = useRegisterUploadedMutation();
	const { queueMessage, queue, isOnline, queuedCount } =
		useOfflineQueue(chatId);
	const [messageText, setMessageText] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [sendingMessageIds, setSendingMessageIds] = useState<Set<string>>(
		new Set(),
	);
	const lastReadMessageRef = useRef<string | null>(null);
	const prevTextRef = useRef("");
	const typingTimeoutRef = useRef<number | null>(null);
	const debouncedMessageText = useDebounce(messageText, 300);

	// Track typing state to avoid unnecessary WebSocket calls
	const isTypingRef = useRef(false);

	// Get screen dimensions for image sizing
	const { width: screenWidth } = Dimensions.get("window");
	const maxImageWidth = screenWidth * 0.6; // 60% of screen width for images

	const chat = chats?.find((c: Chat) => c.id === chatId);
	const partnerId = me?.isBusinessPage
		? chat?.clientUserId
		: chat?.businessUserId;
	const { data: partner } = useUserQuery(partnerId);

	// Navigation handlers
	const handleAvatarPress = (userId: string) => {
		router.push(`/(tabs)/profile?userId=${userId}`);
	};

	const handlePartnerAvatarPress = () => {
		if (partner?.id) {
			handleAvatarPress(partner.id);
		}
	};

	const handleWebSocketMessage = useCallback(
		(data: { type: string; user_id?: string }) => {
			const currentUserId = meIdRef.current;

			if (data.type === "typing" && data.user_id !== currentUserId) {
				// Clear existing timeout
				if (typingTimeoutRef.current) {
					clearTimeout(typingTimeoutRef.current);
				}
				setIsTyping(true);
				// Set new timeout
				typingTimeoutRef.current = setTimeout(() => {
					setIsTyping(false);
					typingTimeoutRef.current = null;
				}, 3000);
			} else if (
				data.type === "stop_typing" &&
				data.user_id !== currentUserId
			) {
				// Clear timeout and hide typing indicator
				if (typingTimeoutRef.current) {
					clearTimeout(typingTimeoutRef.current);
					typingTimeoutRef.current = null;
				}
				setIsTyping(false);
			}
		},
		[chatId],
	);

	const { send } = useWebSocket("chat", chatId, {
		onMessage: handleWebSocketMessage,
	});

	useWebSocket("user", me?.id, {});

	// Cleanup typing timeout on unmount
	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
			isTypingRef.current = false;
		};
	}, []);

	useEffect(() => {
		if (chatId && messages && messages.length > 0) {
			const latestMessage = messages[0];
			if (latestMessage && latestMessage.id !== lastReadMessageRef.current) {
				lastReadMessageRef.current = latestMessage.id;
				markReadMutation.mutate({ body: { chat_id: chatId } });
			}
		}
	}, [chatId, messages]);

	// Reset typing state when message is cleared
	useEffect(() => {
		if (messageText.length === 0 && isTypingRef.current) {
			isTypingRef.current = false;
		}
	}, [messageText]);

	const handleSend = () => {
		if (!messageText.trim()) return;

		// Use offline queue for sending
		queueMessage(messageText.trim());
		setMessageText("");
	};

	const handleImagePick = async () => {
		try {
			// Request permission first
			const permissionResult =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (!permissionResult.granted) {
				Alert.alert(
					"Permission Required",
					"Please grant camera roll permissions to send images.",
				);
				return;
			}

			// Launch image picker
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [4, 3],
				quality: 0.8,
			});

			if (result.canceled || !result.assets || result.assets.length === 0) {
				return;
			}

			const asset = result.assets[0];
			if (asset) {
				await uploadAndSendImage(asset);
			}
		} catch (error) {
			console.error("Image picker error:", error);
			Alert.alert("Error", "Failed to pick image. Please try again.");
		}
	};

	const uploadAndSendImage = async (asset: ImagePicker.ImagePickerAsset) => {
		try {
			setIsUploading(true);

			// Get file info
			const response = await fetch(asset.uri);
			const blob = await response.blob();
			const mimeType = blob.type || "image/jpeg";
			const sizeBytes = blob.size;

			// Step 1: Get presigned upload URL
			const presignResult = await presignMutation.mutateAsync({
				params: {
					query: {
						mime: mimeType,
						sizeBytes: sizeBytes,
						purpose: "attachment",
					},
				},
			});

			// Step 2: Upload file to presigned URL
			const uploadResponse = await fetch(presignResult.uploadUrl, {
				method: "PUT",
				headers: {
					"Content-Type": mimeType,
				},
				body: blob,
			});

			if (!uploadResponse.ok) {
				throw new Error("Failed to upload file");
			}

			// Step 3: Register media in database
			const registerResult = await registerMutation.mutateAsync({
				body: {
					url: presignResult.publicUrl,
					mime: mimeType,
					sizeBytes: sizeBytes,
					meta: {
						width: asset.width,
						height: asset.height,
						filename: asset.fileName,
					},
				},
			});

			// Step 4: Send message with media attachment using offline queue
			queueMessage("", registerResult.mediaId);
		} catch (error) {
			console.error("Upload error:", error);
			Alert.alert("Upload Failed", "Failed to upload image. Please try again.");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Screen>
			<ChatHeader partner={partner} onAvatarPress={handlePartnerAvatarPress} />
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={{ flex: 1 }}
			>
				<FlatList
					data={messages}
					keyExtractor={(item) => item.id}
					onEndReached={() => {
						if (hasNextPage && !isFetchingNextPage) {
							fetchNextPage();
						}
					}}
					onEndReachedThreshold={0.1}
					contentContainerStyle={{ paddingHorizontal: theme.spacing.m }}
					renderItem={({ item, index }) => {
						const isMe = item.senderUserId === me?.id;

						return (
							<MessageItem
								item={item}
								index={index}
								messages={messages || []}
								isMe={isMe}
								partner={partner}
								sendingMessageIds={sendingMessageIds}
								onAvatarPress={handleAvatarPress}
								screenWidth={screenWidth}
							/>
						);
					}}
					inverted
				/>
				{isTyping && <TypingIndicator />}
				{!isOnline && (
					<Box backgroundColor="muted" padding="s" alignItems="center">
						<Text color="foreground" variant="caption">
							{queuedCount > 0
								? `${queuedCount} messages queued. Reconnecting...`
								: "Connection lost. Messages will be queued."}
						</Text>
					</Box>
				)}
				{isOnline && queuedCount > 0 && (
					<Box backgroundColor="secondary" padding="s" alignItems="center">
						<Text color="foreground" variant="caption">
							Sending {queuedCount} queued message{queuedCount > 1 ? "s" : ""}
							...
						</Text>
					</Box>
				)}
				<Box
					flexDirection="row"
					padding="s"
					gap="s"
					paddingBottom={Platform.OS === "ios" ? "xl" : "s"}
					backgroundColor="background"
				>
					<Pressable
						onPress={handleImagePick}
						disabled={isUploading}
						style={{
							width: 44,
							height: 44,
							borderRadius: 22,
							backgroundColor: isUploading
								? theme.colors.muted
								: theme.colors.primary,
							alignItems: "center",
							justifyContent: "center",
							opacity: isUploading ? 0.6 : 1,
						}}
					>
						{isUploading ? (
							<Ionicons
								name="hourglass-outline"
								size={20}
								color={theme.colors["muted-foreground"]}
							/>
						) : (
							<Ionicons
								name="image"
								size={20}
								color={theme.colors["primary-foreground"]}
							/>
						)}
					</Pressable>
					<Box flex={1}>
						<Input
							value={messageText}
							onChangeText={(text) => {
								setMessageText(text);

								// Optimized typing detection - only check when needed
								const hasText = text.length > 0;
								const hadText = prevTextRef.current.length > 0;

								// Only send typing events when state actually changes
								if (hasText !== hadText) {
									if (hasText && !isTypingRef.current) {
										send({ type: "typing" });
										isTypingRef.current = true;
									} else if (!hasText && isTypingRef.current) {
										send({ type: "stop_typing" });
										isTypingRef.current = false;
									}
								}

								prevTextRef.current = text;
							}}
							onBlur={() => {
								if (messageText.length > 0 && isTypingRef.current) {
									send({ type: "stop_typing" });
									isTypingRef.current = false;
								}
							}}
							placeholder="Type a message..."
						/>
					</Box>
					<Pressable
						onPress={handleSend}
						disabled={!messageText.trim()}
						style={{
							width: 44,
							height: 44,
							borderRadius: 22,
							backgroundColor: messageText.trim()
								? theme.colors.primary
								: theme.colors.muted,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Ionicons
							name="send"
							size={20}
							color={
								messageText.trim()
									? theme.colors["primary-foreground"]
									: theme.colors["muted-foreground"]
							}
						/>
					</Pressable>
				</Box>
			</KeyboardAvoidingView>
		</Screen>
	);
}
