import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors, Spacing, BorderRadius } from "../../theme";

interface CardProps {
	children: React.ReactNode;
	style?: ViewStyle;
	padding?: keyof typeof Spacing | number;
	margin?: keyof typeof Spacing | number;
	elevation?: 0 | 1 | 2 | 3 | 4 | 5;
	variant?: "default" | "outlined" | "filled";
}

export const Card: React.FC<CardProps> = ({
	children,
	style,
	padding = "lg",
	margin,
	elevation = 1,
	variant = "default",
}) => {
	const getPadding = () => {
		if (typeof padding === "number") return padding;
		return Spacing[padding] || Spacing.lg;
	};

	const getMargin = () => {
		if (typeof margin === "number") return margin;
		return margin ? Spacing[margin] : 0;
	};

	const getShadowStyle = () => {
		switch (elevation) {
			case 0:
				return {};
			case 1:
				return styles.shadow1;
			case 2:
				return styles.shadow2;
			case 3:
				return styles.shadow3;
			case 4:
				return styles.shadow4;
			case 5:
				return styles.shadow5;
			default:
				return styles.shadow1;
		}
	};

	const getVariantStyle = () => {
		switch (variant) {
			case "outlined":
				return styles.outlined;
			case "filled":
				return styles.filled;
			default:
				return styles.default;
		}
	};

	return (
		<View
			style={[
				styles.container,
				getVariantStyle(),
				getShadowStyle(),
				{ padding: getPadding(), margin: getMargin() },
				style,
			]}
		>
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: BorderRadius.md,
		backgroundColor: Colors.white,
	},
	default: {
		borderWidth: 1,
		borderColor: Colors.border,
	},
	outlined: {
		borderWidth: 1,
		borderColor: Colors.border,
		backgroundColor: "transparent",
	},
	filled: {
		borderWidth: 0,
		backgroundColor: Colors.gray50,
	},
	shadow1: {
		shadowColor: Colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.18,
		shadowRadius: 1.0,
		elevation: 1,
	},
	shadow2: {
		shadowColor: Colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.20,
		shadowRadius: 1.41,
		elevation: 2,
	},
	shadow3: {
		shadowColor: Colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.22,
		shadowRadius: 2.22,
		elevation: 3,
	},
	shadow4: {
		shadowColor: Colors.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.23,
		shadowRadius: 2.62,
		elevation: 4,
	},
	shadow5: {
		shadowColor: Colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
});