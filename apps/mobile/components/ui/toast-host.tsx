import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { View } from "react-native";
import type { Theme } from "@/config/theme";
import { useToastStore } from "@/stores/toast-store";
import { Box, Card, Text } from "./restyle-components";

export function ToastHost() {
	const theme = useTheme<Theme>();
	const toasts = useToastStore((s) => s.toasts);

	if (!toasts.length) return null;
	return (
		<View
			pointerEvents="none"
			style={{
				position: "absolute",
				top: 50,
				left: 0,
				right: 0,
				zIndex: 100,
				width: "100%",
			}}
		>
			{toasts.map((t) => (
				<Box key={t.id} marginHorizontal="l" marginBottom="s">
					<Card
						variant="elevated"
						width="100%"
						flexDirection="row"
						alignItems="center"
						columnGap="s"
					>
						<Ionicons
							name={
								t.type === "success"
									? "checkmark-circle"
									: t.type === "error"
										? "warning"
										: "information-circle"
							}
							size={20}
							color={
								t.type === "success"
									? theme.colors.primary
									: t.type === "error"
										? theme.colors.destructive
										: theme.colors.primary
							}
						/>
						<Box flex={1}>
							<Text variant="body" fontWeight="500">
								{t.title ?? ""}
							</Text>
							{t.message ? <Text variant="caption">{t.message}</Text> : null}
						</Box>
					</Card>
				</Box>
			))}
		</View>
	);
}
