import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "../../theme";

interface LoadingSpinnerProps {
	size?: "small" | "large";
	color?: string;
	text?: string;
	fullScreen?: boolean;
	overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
	size = "large",
	color = Colors.primary,
	text,
	fullScreen = false,
	overlay = false,
}) => {
	const containerStyle = [
		styles.container,
		fullScreen && styles.fullScreen,
		overlay && styles.overlay,
	];

	return (
		<View style={containerStyle}>
			<ActivityIndicator size={size} color={color} />
			{text && <Text style={styles.text}>{text}</Text>}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		justifyContent: "center",
		alignItems: "center",
		padding: Spacing.xl,
	},
	fullScreen: {
		flex: 1,
	},
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255, 255, 255, 0.8)",
		zIndex: 1000,
	},
	text: {
		...Typography.body,
		color: Colors.textSecondary,
		marginTop: Spacing.md,
		textAlign: "center",
	},
});