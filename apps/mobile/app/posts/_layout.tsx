import { useTheme } from "@shopify/restyle";
import { Stack } from "expo-router";
import { BackButton } from "@/components/ui/back-button";
import type { Theme } from "@/config/theme";

export default function ProfileLayout() {
	const theme = useTheme<Theme>();

	return (
		<Stack
			screenOptions={{
				headerLeft: () => <BackButton />,
				headerTitleAlign: "center",
				headerTitleStyle: { color: theme.colors.foreground },
				headerStyle: { backgroundColor: theme.colors.background },
			}}
		>
			<Stack.Screen name="[id]" options={{ title: "Post" }} />
		</Stack>
	);
}
