import { createTheme } from "@shopify/restyle";

const lightColors = {
	background: "#ffffff",
	foreground: "#09090b",
	card: "#ffffff",
	"card-foreground": "#09090b",
	popover: "#ffffff",
	"popover-foreground": "#09090b",
	primary: "#0084d1",
	"primary-foreground": "#09090b",
	secondary: "#f4f4f5",
	"secondary-foreground": "#18181b",
	muted: "#f4f4f5",
	"muted-foreground": "#71717b",
	accent: "#f4f4f5",
	"accent-foreground": "#18181b",
	destructive: "#e7000b",
	border: "#e4e4e7",
	input: "#e4e4e7",
	ring: "#a1a1a1",
};

const darkColors = {
	background: "#09090b",
	foreground: "#eff6ff",
	card: "#09090b",
	"card-foreground": "#eff6ff",
	popover: "#09090b",
	"popover-foreground": "#eff6ff",
	primary: "#0084d1",
	"primary-foreground": "#eff6ff",
	secondary: "#18181b",
	"secondary-foreground": "#eff6ff",
	muted: "#18181b",
	"muted-foreground": "#bdbdc4",
	accent: "#18181b",
	"accent-foreground": "#eff6ff",
	destructive: "#e7000b",
	border: "#212124",
	input: "#212124",
	ring: "#dedede",
};

const baseTheme = {
	spacing: {
		xs: 4,
		s: 8,
		m: 16,
		l: 24,
		xl: 32,
		xxl: 48,
	},
	breakpoints: {
		phone: 0,
		tablet: 768,
	},
	borderRadii: {
		s: 4,
		m: 8,
		l: 16,
		xl: 24,
	},
	textVariants: {
		defaults: {
			fontSize: 16,
			color: "foreground",
		},
		header: {
			fontSize: 24,
			fontWeight: "bold",
			color: "foreground",
		},
		subheader: {
			fontSize: 20,
			fontWeight: "600",
			color: "foreground",
		},
		body: {
			fontSize: 16,
			color: "foreground",
		},
		caption: {
			fontSize: 14,
			color: "muted-foreground",
		},
		label: {
			fontSize: 16,
			fontWeight: "500",
			color: "foreground",
			marginBottom: "xs",
		},
		error: {
			fontSize: 14,
			color: "destructive",
			marginTop: "xs",
		},
	},
	buttonVariants: {
		defaults: {
			minHeight: 44,
			borderRadius: 8,
			paddingHorizontal: 24,
			paddingVertical: 16,
			alignItems: "center",
			justifyContent: "center",
			backgroundColor: "primary",
		},
		primary: {
			backgroundColor: "primary",
		},
		disabled: {
			opacity: 0.5,
		},
	},
	inputVariants: {
		defaults: {
			minHeight: 44,
			borderRadius: 8,
			paddingHorizontal: 16,
			paddingVertical: 8,
			backgroundColor: "card",
			color: "foreground",
			borderWidth: 1,
			borderColor: "input",
		},
	},
	cardVariants: {
		defaults: {
			borderRadius: 8,
			paddingHorizontal: 16,
			paddingVertical: 8,
			backgroundColor: "card",
			borderWidth: 1,
			borderColor: "border",
		},
	},
};

export const lightTheme = createTheme({
	...baseTheme,
	colors: lightColors,
});

export const darkTheme = createTheme({
	...baseTheme,
	colors: darkColors,
});

export type Theme = typeof lightTheme;
