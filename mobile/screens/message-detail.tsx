import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	Dimensions,
	ActivityIndicator,
	Image,
	Keyboard,
} from "react-native";
import { HeaderBackButton } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@store/auth.store";
import { PrimaryButton } from "../components";
import { ScreenNavigationProp, ScreenRouteProp } from "../types";

interface Props {
	route: ScreenRouteProp<"MessageDetail">;
	navigation: ScreenNavigationProp<"MessageDetail">;
}

interface Conversation {
	id: number;
	userId: number;
	sender: string;
	avatar: string | undefined;
	text: string;
	replies: Reply[];
}

interface Reply {
	id: number;
	senderId: number;
	sender: string;
	text: string;
	createdAt: string;
	isCurrentUser: boolean;
}

const { height } = Dimensions.get("window");

const MessageDetailScreen: React.FC<Props> = ({ route, navigation }) => {
	const { messageId } = route.params;
	const { user } = useAuthStore();
	const [conversation, setConversation] = useState<Conversation | null>(null);
	const [newMessage, setNewMessage] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(true);
	const [sending, setSending] = useState<boolean>(false);
	const flatListRef = useRef<FlatList>(null);

	useEffect(() => {
		loadConversation();
	}, [messageId]);

	const loadConversation = () => {
		setLoading(true);
		// TODO: Replace with actual API call when message service is ready
		// const data = await messagesService.getConversation(messageId);

		// Hardcoded conversation for testing
		const hardcodedConversation: Conversation = {
			id: messageId,
			userId: 123,
			sender: "Brooke Davis",
			avatar: undefined,
			text: "Hey! How's your project going?",
			replies: [
				{
					id: 1,
					senderId: 123,
					sender: "Brooke Davis",
					text: "Hey! How's your project going?",
					createdAt: new Date(Date.now() - 3600000).toISOString(),
					isCurrentUser: false,
				},
				{
					id: 2,
					senderId: user?.id || 1,
					sender: "You",
					text: "Hi Brooke! It's going well. Thanks for asking!",
					createdAt: new Date(Date.now() - 3000000).toISOString(),
					isCurrentUser: true,
				},
				{
					id: 3,
					senderId: 123,
					sender: "Brooke Davis",
					text: "No worries. Let me know if you need any help 😊",
					createdAt: new Date(Date.now() - 2400000).toISOString(),
					isCurrentUser: false,
				},
				{
					id: 4,
					senderId: user?.id || 1,
					sender: "You",
					text: "Will do! Thanks!",
					createdAt: new Date(Date.now() - 1800000).toISOString(),
					isCurrentUser: true,
				},
			],
		};

		setTimeout(() => {
			setConversation(hardcodedConversation);
			setLoading(false);
			// Scroll to bottom after loading
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: false });
			}, 100);
		}, 500);
	};

	const sendMessage = async () => {
		if (newMessage.trim().length === 0 || !conversation) return;

		setSending(true);
		Keyboard.dismiss();

		// TODO: Replace with actual API call when message service is ready
		// await messagesService.sendMessage(messageId, newMessage.trim());

		const newReply: Reply = {
			id: conversation.replies.length + 1,
			senderId: user?.id || 1,
			sender: "You",
			text: newMessage.trim(),
			createdAt: new Date().toISOString(),
			isCurrentUser: true,
		};

		setTimeout(() => {
			setConversation((prevConversation) => {
				if (!prevConversation) return null;
				return {
					...prevConversation,
					replies: [...prevConversation.replies, newReply],
				};
			});
			setNewMessage("");
			setSending(false);
			// Scroll to bottom after sending
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 100);
		}, 300);
	};

	const formatTime = (timestamp: string) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const hours = Math.floor(diff / 3600000);
		const minutes = Math.floor((diff % 3600000) / 60000);

		if (hours > 24) {
			return date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});
		} else if (hours > 0) {
			return `${hours}h ago`;
		} else if (minutes > 0) {
			return `${minutes}m ago`;
		} else {
			return "Just now";
		}
	};

	const renderMessage = ({ item, index }: { item: Reply; index: number }) => {
		const showAvatar = !item.isCurrentUser;
		const showTimestamp =
			index === 0 ||
			(index > 0 &&
				new Date(item.createdAt).getTime() -
					new Date(conversation!.replies[index - 1].createdAt).getTime() >
					300000);

		return (
			<View style={styles.messageWrapper}>
				{showTimestamp && (
					<Text style={styles.timestampText}>{formatTime(item.createdAt)}</Text>
				)}
				<View
					style={[
						styles.messageContainer,
						item.isCurrentUser
							? styles.userMessageContainer
							: styles.otherMessageContainer,
					]}
				>
					{showAvatar && (
						<View style={styles.avatarContainer}>
							{conversation?.avatar ? (
								<Image
									source={{ uri: conversation.avatar }}
									style={styles.messageAvatar}
								/>
							) : (
								<View style={styles.messageAvatarPlaceholder}>
									<Ionicons name="person" size={16} color="#9CA3AF" />
								</View>
							)}
						</View>
					)}
					<View
						style={[
							styles.messageBubble,
							item.isCurrentUser ? styles.userMessage : styles.otherMessage,
							!showAvatar && !item.isCurrentUser && styles.otherMessageNoAvatar,
						]}
					>
						<Text
							style={[
								styles.messageText,
								item.isCurrentUser
									? styles.userMessageText
									: styles.otherMessageText,
							]}
						>
							{item.text}
						</Text>
					</View>
				</View>
			</View>
		);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#6ba32d" />
				<Text style={styles.loadingText}>Loading conversation...</Text>
			</View>
		);
	}

	if (!conversation) {
		return (
			<View style={styles.errorContainer}>
				<Ionicons name="chatbubbles-outline" size={64} color="#EF4444" />
				<Text style={styles.errorText}>Conversation not found</Text>
				<PrimaryButton title="Go Back" onPress={() => navigation.goBack()} />
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
		>
			<View style={styles.header}>
				<HeaderBackButton
					onPress={() => navigation.navigate("NotificationsTab")}
					tintColor="#6ba32d"
				/>
				<View style={styles.headerContent}>
					{conversation.avatar ? (
						<Image
							source={{ uri: conversation.avatar }}
							style={styles.headerAvatar}
						/>
					) : (
						<View style={styles.headerAvatarPlaceholder}>
							<Ionicons name="person" size={20} color="#9CA3AF" />
						</View>
					)}
					<View style={styles.headerTextContainer}>
						<Text style={styles.headerTitle}>{conversation.sender}</Text>
						<Text style={styles.headerSubtitle}>Active now</Text>
					</View>
				</View>
				<TouchableOpacity style={styles.headerAction}>
					<Ionicons
						name="information-circle-outline"
						size={24}
						color="#6ba32d"
					/>
				</TouchableOpacity>
			</View>

			<FlatList
				ref={flatListRef}
				data={conversation.replies}
				keyExtractor={(item) => item.id.toString()}
				renderItem={renderMessage}
				contentContainerStyle={styles.messageList}
				showsVerticalScrollIndicator={false}
				onContentSizeChange={() =>
					flatListRef.current?.scrollToEnd({ animated: false })
				}
			/>

			<View style={styles.inputContainer}>
				<TouchableOpacity style={styles.attachButton}>
					<Ionicons name="add-circle-outline" size={28} color="#6ba32d" />
				</TouchableOpacity>
				<View style={styles.inputWrapper}>
					<TextInput
						style={styles.input}
						value={newMessage}
						onChangeText={setNewMessage}
						placeholder="Type a message..."
						placeholderTextColor="#9CA3AF"
						multiline
						maxLength={500}
					/>
				</View>
				<TouchableOpacity
					style={[
						styles.sendButton,
						(newMessage.trim().length === 0 || sending) &&
							styles.sendButtonDisabled,
					]}
					onPress={sendMessage}
					disabled={newMessage.trim().length === 0 || sending}
				>
					{sending ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : (
						<Ionicons name="send" size={20} color="#ffffff" />
					)}
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
		paddingTop: height * 0.08,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: "#6B7280",
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
		padding: 20,
	},
	errorText: {
		fontSize: 18,
		color: "#EF4444",
		marginTop: 16,
		marginBottom: 24,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 8,
		backgroundColor: "#ffffff",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	headerContent: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		marginLeft: -8,
	},
	headerAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#E5E7EB",
		marginRight: 12,
	},
	headerAvatarPlaceholder: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#E5E7EB",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	headerTextContainer: {
		flex: 1,
	},
	headerTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1F2937",
	},
	headerSubtitle: {
		fontSize: 12,
		color: "#10B981",
		marginTop: 2,
	},
	headerAction: {
		padding: 8,
	},
	messageList: {
		paddingHorizontal: 16,
		paddingVertical: 16,
	},
	messageWrapper: {
		marginBottom: 12,
	},
	timestampText: {
		fontSize: 12,
		color: "#9CA3AF",
		textAlign: "center",
		marginBottom: 12,
	},
	messageContainer: {
		flexDirection: "row",
		alignItems: "flex-end",
	},
	userMessageContainer: {
		justifyContent: "flex-end",
	},
	otherMessageContainer: {
		justifyContent: "flex-start",
	},
	avatarContainer: {
		marginRight: 8,
	},
	messageAvatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#E5E7EB",
	},
	messageAvatarPlaceholder: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#E5E7EB",
		justifyContent: "center",
		alignItems: "center",
	},
	messageBubble: {
		maxWidth: "75%",
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 20,
	},
	userMessage: {
		backgroundColor: "#6ba32d",
		borderBottomRightRadius: 4,
		alignSelf: "flex-end",
	},
	otherMessage: {
		backgroundColor: "#ffffff",
		borderBottomLeftRadius: 4,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		alignSelf: "flex-start",
	},
	otherMessageNoAvatar: {
		marginLeft: 40,
	},
	messageText: {
		fontSize: 15,
		lineHeight: 20,
	},
	userMessageText: {
		color: "#ffffff",
	},
	otherMessageText: {
		color: "#1F2937",
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "flex-end",
		padding: 12,
		backgroundColor: "#ffffff",
		borderTopWidth: 1,
		borderTopColor: "#E5E7EB",
	},
	attachButton: {
		padding: 6,
		marginRight: 8,
	},
	inputWrapper: {
		flex: 1,
		backgroundColor: "#F3F4F6",
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 8,
		maxHeight: 100,
	},
	input: {
		fontSize: 15,
		color: "#1F2937",
		maxHeight: 80,
	},
	sendButton: {
		backgroundColor: "#6ba32d",
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 8,
	},
	sendButtonDisabled: {
		backgroundColor: "#9CA3AF",
	},
});

export default MessageDetailScreen;
