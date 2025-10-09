import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ScreenHeaderProps {
	title: string;
	onBack?: () => void;
	rightAction?: React.ReactNode;
	showBackButton?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
	title,
	onBack,
	rightAction,
	showBackButton = true,
}) => {
	return (
		<View style={styles.header}>
			{showBackButton ? (
				<TouchableOpacity onPress={onBack} style={styles.backBtn}>
					<Ionicons name="arrow-back" size={24} color="#333" />
				</TouchableOpacity>
			) : (
				<View style={styles.backBtn} />
			)}
			<Text style={styles.headerTitle}>{title}</Text>
			{rightAction ? (
				<View style={styles.rightAction}>{rightAction}</View>
			) : (
				<View style={styles.backBtn} />
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingTop: 50,
		paddingBottom: 16,
		backgroundColor: "#fff",
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	backBtn: {
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "center",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#333",
	},
	rightAction: {
		justifyContent: "center",
		alignItems: "center",
	},
});
