import React from "react";
import {
	View,
	Text,
	ScrollView,
	RefreshControl,
	StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StatsCard from "./stats-card";
import type { Clique } from "../types";

interface AboutTabProps {
	clique: Clique;
	refreshing: boolean;
	onRefresh: () => void;
}

const AboutTab: React.FC<AboutTabProps> = ({
	clique,
	refreshing,
	onRefresh,
}) => {
	return (
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
					{clique.description || "No description available"}
				</Text>

				<StatsCard
					membersCount={clique.membersCount || 0}
					postsCount={clique.postsCount || 0}
					servicesCount={0} // Assuming services count is not in clique
				/>

				{clique.createdAt && (
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
};

const styles = StyleSheet.create({
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
});

export default AboutTab;
