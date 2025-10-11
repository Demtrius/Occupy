import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "../../theme";

interface UserStatsProps {
	followersCount?: number;
	followingCount?: number;
	postsCount?: number;
}

export const UserStats: React.FC<UserStatsProps> = ({
	followersCount = 0,
	followingCount = 0,
	postsCount,
}) => {
	return (
		<View style={styles.container}>
			{postsCount !== undefined && (
				<View style={styles.statItem}>
					<Text style={styles.statNumber}>{postsCount}</Text>
					<Text style={styles.statLabel}>Posts</Text>
				</View>
			)}
			<View style={styles.statItem}>
				<Text style={styles.statNumber}>{followersCount}</Text>
				<Text style={styles.statLabel}>Followers</Text>
			</View>
			<View style={styles.statItem}>
				<Text style={styles.statNumber}>{followingCount}</Text>
				<Text style={styles.statLabel}>Following</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		justifyContent: "space-around",
		gap: Spacing.xl,
		marginVertical: Spacing.lg,
	},
	statItem: {
		alignItems: "center",
		minWidth: 60,
	},
	statNumber: {
		...Typography.h3,
		fontWeight: "bold",
		color: Colors.textPrimary,
	},
	statLabel: {
		...Typography.small,
		color: Colors.textSecondary,
		marginTop: Spacing.xs,
	},
});