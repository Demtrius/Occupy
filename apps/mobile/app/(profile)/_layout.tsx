import { useTheme } from "@shopify/restyle";
import { Stack } from "expo-router";
import { BackButton } from "@/components/ui/back-button";
import type { Theme } from "@/config/theme";

export default function ProfileLayout() {
	const theme = useTheme<Theme>();

	return (
		<Stack
			screenOptions={{
				headerLeft: () => <BackButton path="/(tabs)/profile" />,
				headerTitleAlign: "center",
				headerStyle: { backgroundColor: theme.colors.background },
				headerTintColor: theme.colors.foreground,
			}}
		>
			<Stack.Screen name="edit" options={{ title: "Edit Profile" }} />
			<Stack.Screen name="followers" options={{ title: "Followers" }} />
			<Stack.Screen name="following" options={{ title: "Following" }} />
		</Stack>
	);
}
