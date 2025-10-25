import { Ionicons } from "@expo/vector-icons";
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
			<Tabs.Screen
				name="feed"
				options={{
					title: "Feed",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="home-outline" color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					title: "Search",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="search-outline" color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="cliques"
				options={{
					title: "Cliques",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="people-outline" color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="messages"
				options={{
					title: "Messages",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="chatbubble-outline" color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="person-outline" color={color} size={size} />
					),
				}}
			/>
		</Tabs>
	);
}
