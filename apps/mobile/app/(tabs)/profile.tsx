import { router } from "expo-router";
import { Pressable } from "react-native";
import { Button } from "@/components/ui/button";
import { Box, Text } from "@/components/ui/restyle-components";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";

export default function Page() {
	const user = useAuthStore((s) => s.user);
	const clear = useAuthStore((s) => s.clear);
	const { mode, setMode } = useThemeStore();

	return (
		<Box
			flex={1}
			alignItems="center"
			justifyContent="center"
			backgroundColor="background"
		>
			<Text variant="subheader" marginBottom="l">
				Hello {user?.username ?? "user"}
			</Text>
			<Button
				onPress={async () => {
					await clear();
					router.replace("/(auth)/login");
				}}
			>
				Logout
			</Button>
			<Pressable
				style={{
					marginTop: 24,
					borderRadius: 24,
					paddingHorizontal: 12,
					paddingVertical: 8,
				}}
				onPress={() =>
					setMode(
						mode === "light" ? "dark" : mode === "dark" ? "system" : "light",
					)
				}
			>
				<Box
					backgroundColor="muted"
					borderRadius="xl"
					paddingHorizontal="m"
					paddingVertical="s"
				>
					<Text variant="body">Theme: {mode}</Text>
				</Box>
			</Pressable>
		</Box>
	);
}
