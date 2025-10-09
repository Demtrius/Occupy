import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatsCardProps {
	membersCount: number;
	postsCount: number;
	servicesCount: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
	membersCount,
	postsCount,
	servicesCount,
}) => {
	return (
		<View style={styles.statsContainer}>
			<View style={styles.statItem}>
				<Ionicons name="people" size={24} color="#6ba32d" />
				<Text style={styles.statNumber}>{membersCount}</Text>
				<Text style={styles.statLabel}>Members</Text>
			</View>
			<View style={styles.statItem}>
				<Ionicons name="document-text" size={24} color="#6ba32d" />
				<Text style={styles.statNumber}>{postsCount}</Text>
				<Text style={styles.statLabel}>Posts</Text>
			</View>
			<View style={styles.statItem}>
				<Ionicons name="calendar" size={24} color="#6ba32d" />
				<Text style={styles.statNumber}>{servicesCount}</Text>
				<Text style={styles.statLabel}>Services</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
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
});

export default StatsCard;
