import { createTheme } from "@shopify/restyle";

const lightColors = {
	transparent: "transparent",
	background: "#ffffff",
	foreground: "#09090b",
	card: "#ffffff",
	"card-foreground": "#09090b",
	popover: "#ffffff",
	"popover-foreground": "#09090b",
	primary: "#0084d1",
	"primary-foreground": "#ffffff",
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
} as const;

const darkColors = {
	transparent: "transparent",
	background: "#09090b",
	foreground: "#eff6ff",
	card: "#09090b",
	"card-foreground": "#eff6ff",
	popover: "#09090b",
	"popover-foreground": "#eff6ff",
	primary: "#0084d1",
	"primary-foreground": "#ffffff",
	secondary: "#18181b",
	"secondary-foreground": "#eff6ff",
	muted: "#18181b",
	"muted-foreground": "#bdbdc4",
	accent: "#18181b",
	"accent-foreground": "#eff6ff",
	destructive: "#e7000b",
	border: "#212124",
	input: "#212124",
	ring: "#505050",
} as const;

const baseTheme = {
	colors: {},
	spacing: {
		xs: 4,
		s: 8,
		m: 16,
		l: 24,
		xl: 32,
		xxl: 48,
		xxxl: 64,
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
		xxl: 32,
	},
	textVariants: {
		defaults: {
			fontSize: 16,
			color: "primary-foreground",
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
		"small-header": {
			fontSize: 16,
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
			marginBottom: "s",
		},
		error: {
			fontSize: 14,
			color: "destructive",
			marginTop: "xs",
		},
	},
	buttonVariants: {
		defaults: {},
		primary: {},
		secondary: {
			backgroundColor: "secondary",
			color: "foreground",
		},
		ghost: {
			backgroundColor: "transparent",
			color: "foreground",
			minHeight: undefined,
			paddingHorizontal: 0,
			paddingVertical: 0,
		},
		icon: {
			minWidth: 52,
			minHeight: 52,
			paddingHorizontal: "m",
			paddingVertical: "s",
		},
		disabled: {
			opacity: 0.5,
		},
	},
	inputVariants: {
		defaults: {},
	},
	cardVariants: {
		defaults: {
			shadowColor: "ring",
			shadowOffset: {
				width: 0,
				height: 2,
			},
			shadowOpacity: 0.12,
			shadowRadius: 4,
			elevation: 2,
		},
		elevated: {
			shadowColor: "ring",
			shadowOffset: {
				width: 0,
				height: 4,
			},
			shadowOpacity: 0.2,
			shadowRadius: 8,
			elevation: 5,
		},
		inline: {
			borderTopWidth: 0,
			borderBottomColor: "border",
			paddingHorizontal: "s",
			paddingVertical: undefined,
			elevation: 4,
			shadowColor: "ring",
			shadowOffset: {
				height: 6,
			},
			shadowRadius: 8,
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
