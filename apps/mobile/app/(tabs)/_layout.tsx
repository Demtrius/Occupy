import { useTheme } from "@shopify/restyle";
import { Tabs } from "expo-router";
import type { Theme } from "@/config/theme";

export default function TabsLayout() {
	const theme = useTheme<Theme>();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: theme.colors["muted-foreground"],
				tabBarStyle: {
					backgroundColor: theme.colors.card,
					borderTopColor: theme.colors.border,
				},
			}}
		>
			<Tabs.Screen name="feed" options={{ title: "Feed" }} />
			<Tabs.Screen name="search" options={{ title: "Search" }} />
			<Tabs.Screen name="cliques" options={{ title: "Cliques" }} />
			<Tabs.Screen name="messages" options={{ title: "Messages" }} />
			<Tabs.Screen name="profile" options={{ title: "Profile" }} />
		</Tabs>
	);
}
