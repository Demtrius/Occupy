import { View } from "react-native";
import { useToastStore } from "@/stores/toast-store";
import { Box, Card, Text } from "./restyle-components";

export function ToastHost() {
	const toasts = useToastStore((s) => s.toasts);

	if (!toasts.length) return null;
	return (
		<View
			pointerEvents="none"
			style={{ position: "absolute", top: 50, left: 0, right: 0, zIndex: 100 }}
		>
			{toasts.map((t) => (
				<Box key={t.id} marginHorizontal="l" marginBottom="s">
					<Card>
						<Text variant="body" fontWeight="500">
							{t.type === "success" ? "✓ " : t.type === "error" ? "⚠ " : "ℹ "}
							{t.title ?? ""}
						</Text>
						{t.message ? <Text variant="caption">{t.message}</Text> : null}
					</Card>
				</Box>
			))}
		</View>
	);
}
