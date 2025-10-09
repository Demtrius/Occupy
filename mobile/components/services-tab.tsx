import React from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "./ui/primary-button";
import type { Service } from "../types";

interface ServicesTabProps {
	services: Service[];
	refreshing: boolean;
	onRefresh: () => void;
	isOwner: boolean;
	onAddService: () => void;
	onBookService: (service: Service) => void;
}

const ServicesTab: React.FC<ServicesTabProps> = ({
	services,
	refreshing,
	onRefresh,
	isOwner,
	onAddService,
	onBookService,
}) => {
	const renderService = ({ item }: { item: Service }) => (
		<View style={styles.serviceCard}>
			<View style={styles.serviceHeader}>
				<Text style={styles.serviceTitle}>{item.title}</Text>
				{item.price && <Text style={styles.servicePrice}>€{item.price}</Text>}
			</View>
			<Text style={styles.serviceDescription} numberOfLines={2}>
				{item.description}
			</Text>
			<View style={styles.serviceFooter}>
				<View style={styles.serviceMeta}>
					<Ionicons name="time-outline" size={16} color="#6B7280" />
					<Text style={styles.serviceMetaText}>{item.durationMinutes} min</Text>
				</View>
				<PrimaryButton
					title={item.isActive ? "Book Now" : "Unavailable"}
					onPress={() => onBookService(item)}
					disabled={!item.isActive}
					style={{ margin: 0, paddingVertical: 8, paddingHorizontal: 16 }}
					textStyle={{ fontSize: 14 }}
				/>
			</View>
		</View>
	);

	return (
		<FlatList
			key="services-tab"
			style={styles.tabContent}
			data={services}
			keyExtractor={(item) => item.id.toString()}
			renderItem={renderService}
			ListHeaderComponent={
				isOwner ? (
					<PrimaryButton
						title="Add Service"
						onPress={onAddService}
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
};

const styles = StyleSheet.create({
	tabContent: {
		flex: 1,
		padding: 16,
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
});

export default ServicesTab;
