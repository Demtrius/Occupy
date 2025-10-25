import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { Box, Text } from "@/components/ui/restyle-components";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Theme } from "@/config/theme";
import { getItem, setItem } from "@/lib/storage";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";

export default function Page() {
	const theme = useTheme<Theme>();
	const router = useRouter();
	const themeStore = useThemeStore();
	const authStore = useAuthStore();
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);

	useEffect(() => {
		const loadNotifications = async () => {
			const value = await getItem("settings.notifications");
			setNotificationsEnabled(value === "true");
		};
		loadNotifications();
	}, []);

	const toggleNotifications = async (value: boolean) => {
		setNotificationsEnabled(value);
		await setItem("settings.notifications", value.toString());
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<Box padding="m">
				{/* Theme Section */}
				<Box marginBottom="m">
					<Text variant="subheader" marginBottom="s">
						Theme
					</Text>
					<Box flexDirection="row">
						{["light", "dark", "system"].map((mode) => {
							const isSelected = themeStore.mode === mode;
							return (
								<TouchableOpacity
									key={mode}
									onPress={() =>
										themeStore.setMode(mode as "light" | "dark" | "system")
									}
									style={{
										flex: 1,
										paddingHorizontal: 16,
										paddingVertical: 8,
										borderRadius: 8,
										backgroundColor: isSelected
											? theme.colors.primary
											: theme.colors.muted,
										marginHorizontal: 4,
									}}
								>
									<Text
										variant="body"
										color={isSelected ? "primary-foreground" : "foreground"}
										style={{ textAlign: "center" }}
									>
										{mode.charAt(0).toUpperCase() + mode.slice(1)}
									</Text>
								</TouchableOpacity>
							);
						})}
					</Box>
				</Box>

				{/* Notifications Section */}
				<Box marginBottom="m">
					<Text variant="subheader" marginBottom="s">
						Notifications
					</Text>
					<Box
						flexDirection="row"
						alignItems="center"
						justifyContent="space-between"
					>
						<Text variant="body">Enable Notifications</Text>
						<Switch
							value={notificationsEnabled}
							onValueChange={toggleNotifications}
						/>
					</Box>
				</Box>

				{/* Language Section */}
				<Box marginBottom="m">
					<Text variant="subheader" marginBottom="s">
						Language
					</Text>
					<Text variant="body">English (Coming Soon)</Text>
				</Box>

				{/* Logout Section */}
				<Box marginBottom="m">
					<Button
						onPress={async () => {
							await authStore.clear();
							router.replace("/(auth)/login");
						}}
					>
						Log Out
					</Button>
				</Box>
			</Box>
		</ScrollView>
	);
}
