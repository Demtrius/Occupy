import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Tabs, useRouter } from "expo-router";
import type { Theme } from "@/config/theme";
import { useDoubleTap } from "@/hooks";

export default function TabsLayout() {
	const theme = useTheme<Theme>();
	const router = useRouter();
	const handleProfileDoubleTap = useDoubleTap(() => {
		router.replace("/(tabs)/profile");
	});

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
					tabBarIcon: ({ color, size, focused }) =>
						focused ? (
							<Ionicons name="home" color={color} size={size} />
						) : (
							<Ionicons name="home-outline" color={color} size={size} />
						),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					title: "Search",
					tabBarIcon: ({ color, size, focused }) =>
						focused ? (
							<Ionicons name="search" color={color} size={size} />
						) : (
							<Ionicons name="search-outline" color={color} size={size} />
						),
				}}
			/>
			<Tabs.Screen
				name="cliques"
				options={{
					title: "Cliques",
					tabBarIcon: ({ color, size, focused }) =>
						focused ? (
							<Ionicons name="people" color={color} size={size} />
						) : (
							<Ionicons name="people-outline" color={color} size={size} />
						),
				}}
			/>
			<Tabs.Screen
				name="messages"
				options={{
					title: "Messages",
					tabBarIcon: ({ color, size, focused }) =>
						focused ? (
							<Ionicons name="chatbubble" color={color} size={size} />
						) : (
							<Ionicons name="chatbubble-outline" color={color} size={size} />
						),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: ({ color, size, focused }) =>
						focused ? (
							<Ionicons name="person" color={color} size={size} />
						) : (
							<Ionicons name="person-outline" color={color} size={size} />
						),
				}}
				listeners={() => ({
					tabPress: () => {
						handleProfileDoubleTap();
					},
				})}
			/>
		</Tabs>
	);
}
