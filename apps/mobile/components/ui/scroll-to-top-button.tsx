import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";

interface ScrollToTopButtonProps {
	onPress: () => void;
}

export function ScrollToTopButton({ onPress }: ScrollToTopButtonProps) {
	const theme = useTheme<Theme>();

	return (
		<Box
			position="absolute"
			bottom={theme.spacing.xl}
			right={theme.spacing.m}
			zIndex={10}
		>
			<TouchableOpacity
				onPress={onPress}
				activeOpacity={0.8}
				style={{
					width: 48,
					height: 48,
					borderRadius: 24,
					backgroundColor: theme.colors.primary,
					justifyContent: "center",
					alignItems: "center",
					shadowColor: theme.colors.foreground,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.25,
					shadowRadius: 4,
					elevation: 5,
				}}
			>
				<Ionicons
					name="arrow-up"
					size={24}
					color={theme.colors["primary-foreground"]}
				/>
			</TouchableOpacity>
		</Box>
	);
}
