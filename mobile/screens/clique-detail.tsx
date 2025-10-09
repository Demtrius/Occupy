import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	ActivityIndicator,
	TouchableOpacity,
	Dimensions,
	Image,
	ScrollView,
	RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import {
	cliquesService,
	postsService,
	bookingService,
	availabilityService,
	servicesService,
} from "../services";
import { showError, showSuccess } from "../store/app.store";
import { useAuthStore } from "../store/auth.store";
import {
	Clique,
	Post,
	Service,
	Availability,
	Booking,
	ScreenNavigationProp,
	ScreenRouteProp,
} from "../types";
import { PrimaryButton, PostItem } from "../components";

const { width, height } = Dimensions.get("window");

interface Props {
	route: ScreenRouteProp<"CliqueDetail">;
}

type TabType =
	| "About"
	| "Services"
	| "Availability"
	| "Bookings"
	| "Posts"
	| "Reviews";

const CliqueDetailScreen: React.FC<Props> = ({ route }) => {
	const navigation = useNavigation<ScreenNavigationProp<"CliqueDetail">>();
	const user = useAuthStore((state) => state.user);
	const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

	const { id } = route.params;

	const [clique, setClique] = useState<Clique | null>(null);
	const [posts, setPosts] = useState<Post[]>([]);
	const [services, setServices] = useState<Service[]>([]);
	const [availability, setAvailability] = useState<Availability[]>([]);
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [activeTab, setActiveTab] = useState<TabType>("About");
	const [isMember, setIsMember] = useState<boolean>(false);
	const [isOwner, setIsOwner] = useState<boolean>(false);
	const [joiningClique, setJoiningClique] = useState<boolean>(false);

	useEffect(() => {
		loadCliqueData();
	}, [id]);

	useEffect(() => {
		if (clique && user) {
			// Handle createdBy being either a User object or just an ID
			const createdById =
				typeof clique.createdBy === "object"
					? clique.createdBy?.id
					: clique.createdBy;
			setIsOwner(createdById === user.id);
			setIsMember(clique.isMember ?? false);
		}
	}, [clique, user]);

	const loadTabData = useCallback(
		async (tab: TabType) => {
			try {
				switch (tab) {
					case "Services":
						const servicesData = await servicesService.getCliqueServices(id);
						setServices(servicesData);
						break;
					case "Availability":
						const availabilityData =
							await availabilityService.getCliqueAvailability(id);
						setAvailability(availabilityData);
						break;
					case "Bookings":
						if (isOwner) {
							const bookingsData = await bookingService.getCliqueBookings(id);
							setBookings(bookingsData);
						}
						break;
					case "Posts":
						const postsData = await postsService.getPostsByClique(id);
						setPosts(
							Array.isArray(postsData) ? postsData : postsData.results || [],
						);
						break;
				}
			} catch (error: any) {
				console.error(`Error loading ${tab} data:`, error);
				showError(`Failed to load ${tab.toLowerCase()}`);
			}
		},
		[id, isOwner],
	);

	const loadCliqueData = async () => {
		try {
			setLoading(true);
			const cliqueData = await cliquesService.getCliqueById(id);
			setClique(cliqueData);

			// Load initial data based on default tab
			await loadTabData("About");
		} catch (error: any) {
			console.error("Error loading clique:", error);
			showError(error.message || "Failed to load clique");
		} finally {
			setLoading(false);
		}
	};

	// Reload data when screen comes into focus (e.g., after creating service/availability)
	useFocusEffect(
		useCallback(() => {
			loadTabData(activeTab);
		}, [activeTab, loadTabData]),
	);

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await loadCliqueData();
			await loadTabData(activeTab);
		} catch (error) {
			console.error("Error refreshing:", error);
		} finally {
			setRefreshing(false);
		}
	};

	const handleTabChange = async (tab: TabType) => {
		setActiveTab(tab);
		await loadTabData(tab);
	};

	const handleJoinLeave = async () => {
		if (!isLoggedIn) {
			showError("Please log in to join this clique");
			return;
		}

		try {
			setJoiningClique(true);
			if (isMember) {
				await cliquesService.leaveClique(id);
				setIsMember(false);
				showSuccess("Left the clique");
			} else {
				await cliquesService.joinClique(id);
				setIsMember(true);
				showSuccess("Joined the clique");
			}
			await loadCliqueData();
		} catch (error: any) {
			console.error("Error joining/leaving clique:", error);
			showError(error.message || "Failed to update membership");
		} finally {
			setJoiningClique(false);
		}
	};

	const handleBookService = (service: Service) => {
		if (!isLoggedIn) {
			showError("Please log in to book a service");
			return;
		}
		// Navigate to booking screen (to be created)
		navigation.navigate("BookingCreate", { serviceId: service.id });
	};

	const handleAddService = () => {
		navigation.navigate("ServiceCreate", { cliqueId: id });
	};

	const handleAddAvailability = () => {
		navigation.navigate("AvailabilityCreate", { cliqueId: id });
	};

	const getTabs = (): TabType[] => {
		const baseTabs: TabType[] = ["About", "Services", "Posts", "Reviews"];

		if (clique?.isPublic || isMember) {
			baseTabs.splice(2, 0, "Availability");
		}

		if (isOwner) {
			baseTabs.splice(3, 0, "Bookings");
		}

		return baseTabs;
	};

	// Render About Tab
	const renderAboutTab = () => (
		<ScrollView
			style={styles.tabContent}
			showsVerticalScrollIndicator={false}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor="#6ba32d"
					colors={["#6ba32d"]}
				/>
			}
		>
			<View style={styles.aboutContainer}>
				<Text style={styles.sectionTitle}>Description</Text>
				<Text style={styles.description}>
					{clique?.description || "No description available"}
				</Text>

				<View style={styles.statsContainer}>
					<View style={styles.statItem}>
						<Ionicons name="people" size={24} color="#6ba32d" />
						<Text style={styles.statNumber}>{clique?.membersCount || 0}</Text>
						<Text style={styles.statLabel}>Members</Text>
					</View>
					<View style={styles.statItem}>
						<Ionicons name="document-text" size={24} color="#6ba32d" />
						<Text style={styles.statNumber}>{clique?.postsCount || 0}</Text>
						<Text style={styles.statLabel}>Posts</Text>
					</View>
					<View style={styles.statItem}>
						<Ionicons name="calendar" size={24} color="#6ba32d" />
						<Text style={styles.statNumber}>{services.length}</Text>
						<Text style={styles.statLabel}>Services</Text>
					</View>
				</View>

				{clique?.createdAt && (
					<View style={styles.infoRow}>
						<Ionicons name="calendar-outline" size={20} color="#6B7280" />
						<Text style={styles.infoText}>
							Created {new Date(clique.createdAt).toLocaleDateString()}
						</Text>
					</View>
				)}
			</View>
		</ScrollView>
	);

	// Render Services Tab
	const renderServicesTab = () => (
		<FlatList
			key="services-tab"
			style={styles.tabContent}
			data={services}
			keyExtractor={(item) => item.id.toString()}
			renderItem={({ item }) => (
				<View style={styles.serviceCard}>
					<View style={styles.serviceHeader}>
						<Text style={styles.serviceTitle}>{item.title}</Text>
						{item.price && (
							<Text style={styles.servicePrice}>€{item.price}</Text>
						)}
					</View>
					<Text style={styles.serviceDescription} numberOfLines={2}>
						{item.description}
					</Text>
					<View style={styles.serviceFooter}>
						<View style={styles.serviceMeta}>
							<Ionicons name="time-outline" size={16} color="#6B7280" />
							<Text style={styles.serviceMetaText}>
								{item.durationMinutes} min
							</Text>
						</View>
						<PrimaryButton
							title={item.isActive ? "Book Now" : "Unavailable"}
							onPress={() => handleBookService(item)}
							disabled={!item.isActive}
							style={{ margin: 0, paddingVertical: 8, paddingHorizontal: 16 }}
							textStyle={{ fontSize: 14 }}
						/>
					</View>
				</View>
			)}
			ListHeaderComponent={
				isOwner ? (
					<PrimaryButton
						title="Add Service"
						onPress={handleAddService}
						icon="add-circle"
						style={{ marginBottom: 16, marginHorizontal: 0, marginTop: 0 }}
					/>
				) : null
			}
			ListEmptyComponent={
				<View style={styles.emptyContainer}>
					<Ionicons name="briefcase-outline" size={64} color="#9CA3AF" />
					<Text style={styles.emptyText}>No services available</Text>
				</View>
			}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor="#6ba32d"
					colors={["#6ba32d"]}
				/>
			}
			showsVerticalScrollIndicator={false}
		/>
	);

	// Render Availability Tab
	const renderAvailabilityTab = () => (
		<FlatList
			key="availability-tab"
			style={styles.tabContent}
			data={availability}
			keyExtractor={(item) => item.id.toString()}
			renderItem={({ item }) => (
				<View style={styles.availabilityCard}>
					<View style={styles.availabilityHeader}>
						<Ionicons name="calendar" size={20} color="#6ba32d" />
						<Text style={styles.availabilityDate}>
							{item.isRecurring
								? `Every ${item.dayName}`
								: new Date(item.date!).toLocaleDateString()}
						</Text>
					</View>
					<View style={styles.availabilityTime}>
						<Ionicons name="time" size={16} color="#6B7280" />
						<Text style={styles.availabilityTimeText}>
							{item.startTime} - {item.endTime}
						</Text>
					</View>
				</View>
			)}
			ListHeaderComponent={
				isOwner ? (
					<PrimaryButton
						title="Add Availability"
						onPress={handleAddAvailability}
						icon="add-circle"
						style={{ marginBottom: 16, marginHorizontal: 0, marginTop: 0 }}
					/>
				) : null
			}
			ListEmptyComponent={
				<View style={styles.emptyContainer}>
					<Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
					<Text style={styles.emptyText}>No availability set</Text>
				</View>
			}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor="#6ba32d"
					colors={["#6ba32d"]}
				/>
			}
			showsVerticalScrollIndicator={false}
		/>
	);

	// Render Bookings Tab (Owner only)
	const renderBookingsTab = () => (
		<FlatList
			key="bookings-tab"
			style={styles.tabContent}
			data={bookings}
			keyExtractor={(item) => item.id.toString()}
			renderItem={({ item }) => (
				<TouchableOpacity
					style={styles.bookingCard}
					onPress={() => {
						navigation.navigate("BookingDetail", { id: item.id });
					}}
				>
					<View style={styles.bookingHeader}>
						<View>
							<Text style={styles.bookingService}>
								{typeof item.service === "object"
									? item.service.title
									: "Service"}
							</Text>
							<Text style={styles.bookingClient}>
								Client: {item.client.username}
							</Text>
						</View>
						<View
							style={[
								styles.bookingStatus,
								styles[
									`status${
										item.status.charAt(0).toUpperCase() + item.status.slice(1)
									}`
								],
							]}
						>
							<Text style={styles.bookingStatusText}>{item.status}</Text>
						</View>
					</View>
					<View style={styles.bookingDetails}>
						<View style={styles.bookingDetailRow}>
							<Ionicons name="calendar" size={16} color="#6B7280" />
							<Text style={styles.bookingDetailText}>
								{new Date(item.date).toLocaleDateString()}
							</Text>
						</View>
						<View style={styles.bookingDetailRow}>
							<Ionicons name="time" size={16} color="#6B7280" />
							<Text style={styles.bookingDetailText}>
								{item.startTime} - {item.endTime}
							</Text>
						</View>
					</View>
				</TouchableOpacity>
			)}
			ListEmptyComponent={
				<View style={styles.emptyContainer}>
					<Ionicons name="clipboard-outline" size={64} color="#9CA3AF" />
					<Text style={styles.emptyText}>No bookings yet</Text>
				</View>
			}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor="#6ba32d"
					colors={["#6ba32d"]}
				/>
			}
			showsVerticalScrollIndicator={false}
		/>
	);

	// Render Posts Tab
	const renderPostsTab = () => (
		<FlatList
			key="posts-tab"
			style={styles.tabContent}
			data={posts}
			keyExtractor={(item) => item.id.toString()}
			renderItem={({ item }) => <PostItem post={item} />}
			ListEmptyComponent={
				<View style={styles.emptyContainer}>
					<Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
					<Text style={styles.emptyText}>No posts yet</Text>
				</View>
			}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor="#6ba32d"
					colors={["#6ba32d"]}
				/>
			}
			showsVerticalScrollIndicator={false}
		/>
	);

	// Render Reviews Tab
	const renderReviewsTab = () => (
		<ScrollView
			style={styles.tabContent}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor="#6ba32d"
					colors={["#6ba32d"]}
				/>
			}
		>
			<View style={styles.emptyContainer}>
				<Ionicons name="star-outline" size={64} color="#9CA3AF" />
				<Text style={styles.emptyText}>Reviews coming soon</Text>
			</View>
		</ScrollView>
	);

	const renderTabContent = () => {
		switch (activeTab) {
			case "About":
				return renderAboutTab();
			case "Services":
				return renderServicesTab();
			case "Availability":
				return renderAvailabilityTab();
			case "Bookings":
				return renderBookingsTab();
			case "Posts":
				return renderPostsTab();
			case "Reviews":
				return renderReviewsTab();
			default:
				return renderAboutTab();
		}
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#6ba32d" />
				<Text style={styles.loadingText}>Loading clique...</Text>
			</View>
		);
	}

	if (!clique) {
		return (
			<View style={styles.errorContainer}>
				<Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
				<Text style={styles.errorText}>Clique not found</Text>
				<PrimaryButton title="Go Back" onPress={() => navigation.goBack()} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backIcon}
					onPress={() => navigation.goBack()}
				>
					<Ionicons name="arrow-back" size={24} color="#1F2937" />
				</TouchableOpacity>
				<View style={styles.headerContent}>
					{clique.image && (
						<Image source={{ uri: clique.image }} style={styles.cliqueImage} />
					)}
					{!clique.image && (
						<View style={styles.cliqueImagePlaceholder}>
							<Ionicons name="people" size={32} color="#9CA3AF" />
						</View>
					)}
					<View style={styles.headerText}>
						<Text style={styles.cliqueName}>{clique.name}</Text>
						<Text style={styles.cliqueInfo}>
							{clique.membersCount || 0} members
						</Text>
					</View>
				</View>
				{!isOwner && isLoggedIn && (
					<PrimaryButton
						title={isMember ? "Leave" : "Join"}
						onPress={handleJoinLeave}
						disabled={joiningClique}
						loading={joiningClique}
						variant={isMember ? "danger" : "success"}
						style={{
							paddingVertical: 4,
							paddingHorizontal: 12,
							minWidth: 70,
							margin: 0,
						}}
						textStyle={{ fontSize: 14 }}
					/>
				)}
			</View>

			{/* Tabs */}
			<View style={styles.tabsContainer}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.tabsScrollContent}
				>
					{getTabs().map((tab) => (
						<TouchableOpacity
							key={tab}
							style={[styles.tab, activeTab === tab && styles.activeTab]}
							onPress={() => handleTabChange(tab)}
						>
							<Text
								style={[
									styles.tabText,
									activeTab === tab && styles.activeTabText,
								]}
							>
								{tab}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			{/* Tab Content */}
			<View style={styles.content}>{renderTabContent()}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
		paddingTop: height * 0.05,
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
		padding: 16,
		backgroundColor: "#fff",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	backIcon: {
		marginRight: 12,
	},
	headerContent: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
	},
	cliqueImage: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 12,
	},
	cliqueImagePlaceholder: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: "#E5E7EB",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	headerText: {
		flex: 1,
	},
	cliqueName: {
		fontSize: 18,
		fontWeight: "600",
		color: "#1F2937",
	},
	cliqueInfo: {
		fontSize: 14,
		color: "#6B7280",
		marginTop: 2,
	},
	tabsContainer: {
		backgroundColor: "#fff",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	tabsScrollContent: {
		paddingHorizontal: 8,
	},
	tab: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		marginHorizontal: 4,
	},
	activeTab: {
		borderBottomWidth: 2,
		borderBottomColor: "#6ba32d",
	},
	tabText: {
		fontSize: 14,
		color: "#6B7280",
		fontWeight: "500",
	},
	activeTabText: {
		color: "#6ba32d",
		fontWeight: "600",
	},
	content: {
		flex: 1,
	},
	tabContent: {
		flex: 1,
		padding: 16,
	},
	aboutContainer: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#1F2937",
		marginBottom: 12,
	},
	description: {
		fontSize: 15,
		color: "#6B7280",
		lineHeight: 22,
		marginBottom: 20,
	},
	statsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginVertical: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: "#E5E7EB",
	},
	statItem: {
		alignItems: "center",
	},
	statNumber: {
		fontSize: 24,
		fontWeight: "700",
		color: "#1F2937",
		marginTop: 8,
	},
	statLabel: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 4,
	},
	infoRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 12,
	},
	infoText: {
		fontSize: 14,
		color: "#6B7280",
		marginLeft: 8,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 60,
	},
	emptyText: {
		fontSize: 16,
		color: "#6B7280",
		marginTop: 16,
	},
	serviceCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
		elevation: 2,
	},
	serviceHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	serviceTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1F2937",
		flex: 1,
	},
	servicePrice: {
		fontSize: 18,
		fontWeight: "700",
		color: "#6ba32d",
	},
	serviceDescription: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 12,
		lineHeight: 20,
	},
	serviceFooter: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	serviceMeta: {
		flexDirection: "row",
		alignItems: "center",
	},
	serviceMetaText: {
		fontSize: 14,
		color: "#6B7280",
		marginLeft: 6,
	},
	availabilityCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
		elevation: 2,
	},
	availabilityHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	availabilityDate: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1F2937",
		marginLeft: 8,
	},
	availabilityTime: {
		flexDirection: "row",
		alignItems: "center",
	},
	availabilityTimeText: {
		fontSize: 14,
		color: "#6B7280",
		marginLeft: 6,
	},
	bookingCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
		elevation: 2,
	},
	bookingHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 12,
	},
	bookingService: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1F2937",
	},
	bookingClient: {
		fontSize: 14,
		color: "#6B7280",
		marginTop: 4,
	},
	bookingStatus: {
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 6,
	},
	statusPending: {
		backgroundColor: "#FEF3C7",
	},
	statusConfirmed: {
		backgroundColor: "#D1FAE5",
	},
	statusCancelled: {
		backgroundColor: "#FEE2E2",
	},
	statusCompleted: {
		backgroundColor: "#DBEAFE",
	},
	bookingStatusText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#1F2937",
	},
	bookingDetails: {
		flexDirection: "row",
		gap: 16,
	},
	bookingDetailRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	bookingDetailText: {
		fontSize: 14,
		color: "#6B7280",
		marginLeft: 6,
	},
});

export default CliqueDetailScreen;
