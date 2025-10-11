import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../theme";

interface IconButtonProps {
	name: keyof typeof Ionicons.glyphMap;
	size?: number;
	color?: string;
	count?: number;
	onPress?: () => void;
	disabled?: boolean;
	style?: ViewStyle;
	textStyle?: TextStyle;
	showCount?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
	name,
	size = 24,
	color = Colors.primary,
	count,
	onPress,
	disabled = false,
	style,
	textStyle,
	showCount = true,
}) => {
	return (
		<TouchableOpacity
			style={[styles.container, style]}
			onPress={onPress}
			disabled={disabled || !onPress}
			activeOpacity={0.7}
		>
			<Ionicons name={name} size={size} color={disabled ? Colors.textDisabled : color} />
			{showCount && count !== undefined && count > 0 && (
				<Text style={[styles.count, textStyle, disabled && styles.disabledText]}>
					{count}
				</Text>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		padding: Spacing.xs,
	},
	count: {
		...Typography.small,
		color: Colors.textSecondary,
		marginLeft: Spacing.xs,
	},
	disabledText: {
		color: Colors.textDisabled,
	},
});