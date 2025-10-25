import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { Platform, Pressable } from "react-native";
import type { Theme } from "@/config/theme";

interface BackButtonProps {
	path?: Href;
}

export function BackButton({ path }: BackButtonProps = {}) {
	const router = useRouter();
	const theme = useTheme<Theme>();

	const handlePress = path ? () => router.push(path) : () => router.back();

	return (
		<Pressable
			onPress={handlePress}
			hitSlop={10}
			style={{ paddingLeft: Platform.OS === "web" ? 10 : 0 }}
		>
			<Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
		</Pressable>
	);
}
