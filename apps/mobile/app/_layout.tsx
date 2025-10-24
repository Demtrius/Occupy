import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import "../global.css";

import { Slot } from "expo-router";
import Providers from "@/providers";

export const unstable_settings = {
	anchor: "(tabs)",
};

export default function RootLayout() {
	return (
		<Providers>
			<Slot />
		</Providers>
	);
}
