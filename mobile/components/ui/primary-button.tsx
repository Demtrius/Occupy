import React from "react";
import {
	TouchableOpacity,
	Text,
	ActivityIndicator,
	StyleSheet,
	ViewStyle,
	TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PrimaryButtonProps {
	onPress: () => void;
	title: string;
	loading?: boolean;
	disabled?: boolean;
	icon?: keyof typeof Ionicons.glyphMap;
	style?: ViewStyle;
	textStyle?: TextStyle;
	variant?: "primary" | "secondary" | "danger" | "success";
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
	onPress,
	title,
	loading = false,
	disabled = false,
	icon,
	style,
	textStyle,
	variant = "primary",
}) => {
	const getVariantStyle = () => {
		switch (variant) {
			case "primary":
				return styles.primaryButton;
			case "secondary":
				return styles.secondaryButton;
			case "danger":
				return styles.dangerButton;
			case "success":
				return styles.successButton;
			default:
				return styles.primaryButton;
		}
	};

	return (
		<TouchableOpacity
			style={[
				styles.button,
				getVariantStyle(),
				(disabled || loading) && styles.buttonDisabled,
				style,
			]}
			onPress={onPress}
			disabled={disabled || loading}
			activeOpacity={0.7}
		>
			{loading ? (
				<ActivityIndicator size="small" color="#fff" />
			) : (
				<>
					{icon && <Ionicons name={icon} size={20} color="#fff" />}
					<Text style={[styles.buttonText, textStyle]}>{title}</Text>
				</>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		padding: 16,
		borderRadius: 12,
		marginTop: 16,
	},
	primaryButton: {
		backgroundColor: "#6ba32d",
	},
	secondaryButton: {
		backgroundColor: "#FFA500",
	},
	dangerButton: {
		backgroundColor: "#ff6b6b",
	},
	successButton: {
		backgroundColor: "#4CAF50",
	},
	buttonDisabled: {
		backgroundColor: "#ccc",
		opacity: 0.6,
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
});
