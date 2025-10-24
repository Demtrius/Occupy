import { Appearance, type ColorSchemeName } from "react-native";
import { create } from "zustand";

type Mode = "light" | "dark" | "system";
type ThemeState = {
	mode: Mode;
	scheme: Exclude<ColorSchemeName, null>;
	setMode: (m: Mode) => void;
	init: () => void;
};

export const useThemeStore = create<ThemeState>((set, _get) => ({
	mode: "system",
	scheme: "light",
	init: () => {
		const sys = Appearance.getColorScheme() ?? "light";
		set({ scheme: sys as "light" | "dark" });
		const _sub = Appearance.addChangeListener(({ colorScheme }) => {
			const s = (colorScheme ?? "light") as "light" | "dark";
			set({ scheme: s });
		});
		// NOTE: No teardown needed here for app lifetime; if you navigate away, you can store sub.remove() elsewhere.
	},
	setMode: (m) => {
		const effective = m === "system" ? null : (m as "light" | "dark");
		Appearance.setColorScheme(effective);
		const current = Appearance.getColorScheme() ?? "light";
		set({ mode: m, scheme: current as "light" | "dark" });
	},
}));
