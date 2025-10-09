// Theme Configuration

export const Colors = {
	// Primary
	primary: "#6ba32d",
	primaryDark: "#5a8c25",
	primaryLight: "#7cb637",

	// Secondary
	secondary: "#FFA500",
	secondaryDark: "#e69500",
	secondaryLight: "#ffb733",

	// Semantic Colors
	success: "#4CAF50",
	error: "#ff6b6b",
	warning: "#FFA500",
	info: "#2196F3",

	// Neutral Colors
	white: "#ffffff",
	black: "#000000",
	gray50: "#f9f9f9",
	gray100: "#f5f5f5",
	gray200: "#e0e0e0",
	gray300: "#ccc",
	gray400: "#999",
	gray500: "#666",
	gray600: "#333",

	// Text Colors
	textPrimary: "#333",
	textSecondary: "#666",
	textTertiary: "#999",
	textDisabled: "#ccc",
	textInverse: "#fff",

	// Background Colors
	background: "#f5f5f5",
	backgroundLight: "#fff",
	backgroundDark: "#f9f9f9",

	// Border Colors
	border: "#e0e0e0",
	borderLight: "#f0f0f0",
	borderDark: "#ccc",

	// Status Colors
	like: "#ff6b6b",
	verified: "#4CAF50",
	pending: "#FFA500",
	completed: "#4CAF50",
	cancelled: "#ff6b6b",
};

export const Spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
	xxxl: 32,
};

export const Typography = {
	h1: {
		fontSize: 32,
		fontWeight: "700" as const,
		lineHeight: 40,
	},
	h2: {
		fontSize: 24,
		fontWeight: "700" as const,
		lineHeight: 32,
	},
	h3: {
		fontSize: 20,
		fontWeight: "700" as const,
		lineHeight: 28,
	},
	h4: {
		fontSize: 18,
		fontWeight: "700" as const,
		lineHeight: 24,
	},
	body: {
		fontSize: 15,
		fontWeight: "400" as const,
		lineHeight: 22,
	},
	bodyBold: {
		fontSize: 15,
		fontWeight: "600" as const,
		lineHeight: 22,
	},
	small: {
		fontSize: 13,
		fontWeight: "400" as const,
		lineHeight: 18,
	},
	caption: {
		fontSize: 12,
		fontWeight: "400" as const,
		lineHeight: 16,
	},
	button: {
		fontSize: 16,
		fontWeight: "700" as const,
		lineHeight: 24,
	},
};

export const BorderRadius = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	full: 9999,
};

export const Shadows = {
	small: {
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	medium: {
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 4,
	},
	large: {
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 8,
	},
};

export const Layout = {
	headerHeight: 66, // 50px padding top + 16px padding bottom
	tabBarHeight: 60,
	screenPadding: 16,
};

// Common Styles
export const CommonStyles = {
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	centered: {
		flex: 1,
		justifyContent: "center" as const,
		alignItems: "center" as const,
	},
	shadow: Shadows.medium,
	card: {
		backgroundColor: Colors.white,
		borderRadius: BorderRadius.md,
		padding: Spacing.lg,
		...Shadows.small,
	},
	separator: {
		height: 1,
		backgroundColor: Colors.border,
	},
};

export default {
	Colors,
	Spacing,
	Typography,
	BorderRadius,
	Shadows,
	Layout,
	CommonStyles,
};
