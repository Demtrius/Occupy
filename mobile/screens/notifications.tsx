import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Image,
	Dimensions,
	ActivityIndicator,
	RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Searchbar as PaperSearchbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../components";
import { Notification, ScreenNavigationProp } from "../types";

const { width, height } = Dimensions.get("window");

const NotificationsScreen: React.FC = () => {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [search, setSearch] = useState<string>("");
	const [filteredDataSource, setFilteredDataSource] = useState<Notification[]>(
		[],
	);
	const [masterDataSource, setMasterDataSource] = useState<Notification[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const navigation = useNavigation<ScreenNavigationProp<"Notifications">>();

	useEffect(() => {
		loadNotifications();
	}, []);

	const loadNotifications = () => {
		setLoading(true);
		// TODO: Replace with actual API call when message service is ready
		// const data = await messagesService.getConversations();

		// Hardcoded notifications for testing
		const hardcodedNotifications: Notification[] = [
			{
				id: 1,
				sender: "Haley James",
				text: "Hey! How are you doing?",
				unreadCount: 9,
				timestamp: "2m ago",
				type: "message",
			},
			{
				id: 2,
				sender: "Nathan Scott",
				text: "Thanks for your help yesterday!",
				unreadCount: 0,
				timestamp: "1h ago",
				type: "message",
			},
			{
				id: 3,
				sender: "Brooke Davis",
				text: "Can we meet tomorrow?",
				unreadCount: 2,
				timestamp: "3h ago",
				type: "message",
			},
			{
				id: 4,
				sender: "Jamie Scott",
				text: "Great post!",
				unreadCount: 0,
				timestamp: "5h ago",
				type: "message",
			},
			{
				id: 5,
				sender: "Marvin McFadden",
				text: "Looking forward to the event",
				unreadCount: 0,
				timestamp: "1d ago",
				type: "message",
			},
			{
				id: 6,
				sender: "Antwon Taylor",
				text: "Let me know when you're free",
				unreadCount: 0,
				timestamp: "2d ago",
				type: "message",
			},
			{
				id: 7,
				sender: "Jake Jagielski",
				text: "Did you see my message?",
				unreadCount: 0,
				timestamp: "3d ago",
				type: "message",
			},
			{
				id: 8,
				sender: "Peyton Sawyer",
				text: "Happy to connect!",
				unreadCount: 0,
				timestamp: "1w ago",
				type: "message",
			},
		];

		setTimeout(() => {
			setNotifications(hardcodedNotifications);
			setFilteredDataSource(hardcodedNotifications);
			setMasterDataSource(hardcodedNotifications);
			setLoading(false);
		}, 500);
	};

	const onRefresh = async () => {
		setRefreshing(true);
		loadNotifications();
		setTimeout(() => {
			setRefreshing(false);
		}, 500);
	};

	const searchFilterFunction = (text: string) => {
		if (text) {
			const newData = masterDataSource.filter((item) => {
				const senderData = item.sender ? item.sender.toUpperCase() : "";
				const textData = item.text ? item.text.toUpperCase() : "";
				const searchText = text.toUpperCase();
				return (
					senderData.indexOf(searchText) > -1 ||
					textData.indexOf(searchText) > -1
				);
			});
			setFilteredDataSource(newData);
			setSearch(text);
		} else {
			setFilteredDataSource(masterDataSource);
			setSearch(text);
		}
	};

	const handleNotificationPress = (item: Notification) => {
		// Mark as read (will be implemented with real API)
		navigation.navigate("MessageDetail", { messageId: item.id });
	};

	const renderNotification = ({ item }: { item: Notification }) => (
		<TouchableOpacity
			style={[
				styles.notificationContainer,
				item.unreadCount > 0 && styles.unreadNotification,
			]}
			onPress={() => handleNotificationPress(item)}
			activeOpacity={0.7}
		>
			<View style={styles.avatarContainer}>
				{item.avatar ? (
					<Image source={{ uri: item.avatar }} style={styles.avatar} />
				) : (
					<View style={styles.avatarPlaceholder}>
						<Ionicons name="person" size={24} color="#9CA3AF" />
					</View>
				)}
				{item.unreadCount > 0 && <View style={styles.onlineIndicator} />}
			</View>

			<View style={styles.contentContainer}>
				<View style={styles.headerRow}>
					<Text style={styles.senderName} numberOfLines={1}>
						{item.sender}
					</Text>
					{item.timestamp && (
						<Text style={styles.timestamp}>{item.timestamp}</Text>
					)}
				</View>
				<Text
					style={[
						styles.messageText,
						item.unreadCount > 0 && styles.unreadMessageText,
					]}
					numberOfLines={2}
				>
					{item.text}
				</Text>
			</View>

			{item.unreadCount > 0 && (
				<View style={styles.unreadBadge}>
					<Text style={styles.unreadCount}>
						{item.unreadCount > 9 ? "9+" : item.unreadCount}
					</Text>
				</View>
			)}
		</TouchableOpacity>
	);

	const renderEmptyState = () => (
		<View style={styles.emptyContainer}>
			<Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
			<Text style={styles.emptyTitle}>No messages yet</Text>
			<Text style={styles.emptySubtitle}>
				Start a conversation by connecting with others
			</Text>
		</View>
	);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#6ba32d" />
				<Text style={styles.loadingText}>Loading messages...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ScreenHeader title="Messages" showBackButton={false} />

			<PaperSearchbar
				style={styles.searchBar}
				placeholder="Search messages"
				value={search}
				onChangeText={(text) => searchFilterFunction(text)}
				iconColor="#6ba32d"
			/>

			<FlatList
				data={filteredDataSource}
				keyExtractor={(item) => item.id.toString()}
				renderItem={renderNotification}
				contentContainerStyle={[
					styles.listContainer,
					filteredDataSource.length === 0 && styles.emptyListContainer,
				]}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#6ba32d"
						colors={["#6ba32d"]}
					/>
				}
				ListEmptyComponent={renderEmptyState}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	searchBar: {
		marginHorizontal: width * 0.04,
		marginBottom: height * 0.01,
		borderRadius: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		backgroundColor: "#fff",
	},
	listContainer: {
		paddingHorizontal: width * 0.04,
		paddingTop: height * 0.01,
		paddingBottom: 20,
	},
	emptyListContainer: {
		flexGrow: 1,
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
	notificationContainer: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
		elevation: 2,
		marginBottom: 12,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
	},
	unreadNotification: {
		backgroundColor: "#F0FDF4",
		borderLeftWidth: 4,
		borderLeftColor: "#6ba32d",
	},
	avatarContainer: {
		position: "relative",
		marginRight: 12,
	},
	avatar: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#E5E7EB",
	},
	avatarPlaceholder: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#E5E7EB",
		justifyContent: "center",
		alignItems: "center",
	},
	onlineIndicator: {
		position: "absolute",
		bottom: 2,
		right: 2,
		width: 14,
		height: 14,
		borderRadius: 7,
		backgroundColor: "#10B981",
		borderWidth: 2,
		borderColor: "#fff",
	},
	contentContainer: {
		flex: 1,
		justifyContent: "center",
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 4,
	},
	senderName: {
		flex: 1,
		fontSize: 16,
		fontWeight: "600",
		color: "#1F2937",
		marginRight: 8,
	},
	timestamp: {
		fontSize: 12,
		color: "#9CA3AF",
	},
	messageText: {
		fontSize: 14,
		color: "#6B7280",
		lineHeight: 20,
	},
	unreadMessageText: {
		color: "#374151",
		fontWeight: "500",
	},
	unreadBadge: {
		backgroundColor: "#6ba32d",
		borderRadius: 12,
		minWidth: 24,
		height: 24,
		paddingHorizontal: 8,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 8,
	},
	unreadCount: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "700",
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 60,
		paddingHorizontal: 40,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#1F2937",
		marginTop: 16,
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 14,
		color: "#6B7280",
		textAlign: "center",
		lineHeight: 20,
	},
});

export default NotificationsScreen;
