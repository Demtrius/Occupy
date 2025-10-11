import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../theme";
import { PrimaryButton } from "../ui/primary-button";

interface GenericEmptyStateProps {
	title: string;
	message?: string;
	icon?: keyof typeof Ionicons.glyphMap;
	iconSize?: number;
	actionText?: string;
	onAction?: () => void;
	variant?: "default" | "info" | "warning" | "error";
}

export const GenericEmptyState: React.FC<GenericEmptyStateProps> = ({
	title,
	message,
	icon = "document-outline",
	iconSize = 64,
	actionText,
	onAction,
	variant = "default",
}) => {
	const getIconColor = () => {
		switch (variant) {
			case "info":
				return Colors.primary;
			case "warning":
				return Colors.warning;
			case "error":
				return Colors.error;
			default:
				return Colors.textTertiary;
		}
	};

	return (
		<View style={styles.container}>
			<Ionicons name={icon} size={iconSize} color={getIconColor()} />
			<Text style={styles.title}>{title}</Text>
			{message && <Text style={styles.message}>{message}</Text>}
			{actionText && onAction && (
				<PrimaryButton
					title={actionText}
					onPress={onAction}
					style={styles.actionButton}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: Spacing.xl,
	},
	title: {
		...Typography.h3,
		color: Colors.textPrimary,
		marginTop: Spacing.lg,
		marginBottom: Spacing.sm,
		textAlign: "center",
	},
	message: {
		...Typography.body,
		color: Colors.textSecondary,
		textAlign: "center",
		marginBottom: Spacing.xl,
	},
	actionButton: {
		marginTop: Spacing.lg,
		minWidth: 200,
	},
});