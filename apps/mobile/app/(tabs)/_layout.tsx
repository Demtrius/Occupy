import { Redirect, Tabs } from "expo-router";
import { useMe } from "@/hooks/use-auth";

export default function TabLayout() {
	const { data: meData, isLoading } = useMe();
	if (!isLoading && !meData) {
		return <Redirect href="/(auth)/login" />;
	}

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
				}}
			/>
			<Tabs.Screen
				name="cliques"
				options={{
					title: "Cliques",
				}}
			/>
			<Tabs.Screen
				name="messages"
				options={{
					title: "Messages",
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
				}}
			/>
		</Tabs>
	);
}
