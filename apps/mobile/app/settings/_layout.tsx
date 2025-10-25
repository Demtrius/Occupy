import { useTheme } from "@shopify/restyle";
import { Stack } from "expo-router";
import { BackButton } from "@/components/ui/back-button";
import type { Theme } from "@/config/theme";

export default function SettingsLayout() {
	const theme = useTheme<Theme>();

	return (
		<Stack
			screenOptions={{
				headerLeft: () => <BackButton path="/(tabs)/profile" />,
				title: "Settings",
				headerTitleAlign: "center",
				headerStyle: { backgroundColor: theme.colors.background },
				headerTintColor: theme.colors.foreground,
			}}
		/>
	);
}
