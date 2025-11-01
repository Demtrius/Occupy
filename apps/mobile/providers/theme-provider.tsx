import { ThemeProvider as RestyleThemeProvider } from "@shopify/restyle";
import { type PropsWithChildren, useEffect } from "react";
import { darkTheme, lightTheme } from "@/config/theme";
import { useThemeStore } from "@/stores/theme-store";

export default function ThemeProvider({ children }: PropsWithChildren) {
	const initTheme = useThemeStore((s) => s.init);
	const mode = useThemeStore((s) => s.mode);
	const scheme = useThemeStore((s) => s.scheme);

	useEffect(() => {
		initTheme();
	}, [initTheme]);

	const theme =
		mode === "system"
			? scheme === "dark"
				? darkTheme
				: lightTheme
			: mode === "dark"
				? darkTheme
				: lightTheme;

	return <RestyleThemeProvider theme={theme}>{children}</RestyleThemeProvider>;
}
