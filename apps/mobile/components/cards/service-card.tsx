import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Pressable } from "react-native";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Service } from "@/types";

interface ServiceCardProps {
	service: Service;
	isOwner?: boolean;
	onMenuPress?: () => void;
}

export function ServiceCard({
	service,
	isOwner,
	onMenuPress,
}: ServiceCardProps) {
	const theme = useTheme<Theme>();

	return (
		<Card variant="elevated" marginBottom="s" rowGap="s">
			<Box
				flexDirection="row"
				alignItems="flex-start"
				justifyContent="space-between"
				columnGap="s"
			>
				<Text variant="body" fontWeight="600" flexShrink={1}>
					{service.title}
				</Text>
				{isOwner ? (
					<Pressable
						onPress={onMenuPress}
						hitSlop={8}
						style={({ pressed }) => [
							{
								padding: theme.spacing.xs,
								marginRight: -theme.spacing.xs,
								marginTop: -theme.spacing.xs,
								opacity: pressed ? 0.7 : 1,
							},
						]}
					>
						<Ionicons
							name="ellipsis-vertical"
							size={18}
							color={theme.colors["muted-foreground"]}
						/>
					</Pressable>
				) : null}
			</Box>
			{service.description ? (
				<Text variant="body" color="muted-foreground" marginBottom="xs">
					{service.description}
				</Text>
			) : null}
			<Box flexDirection="row" alignItems="center" marginBottom="s">
				<Ionicons
					name="time-outline"
					size={18}
					color={theme.colors["muted-foreground"]}
					style={{ marginRight: theme.spacing.xs }}
				/>
				<Text variant="caption" color="muted-foreground">
					{service.durationMinutes ?? 0} minutes
				</Text>
			</Box>
			{service.priceMinor != null ? (
				<Text variant="body" color="primary" fontWeight="600">
					{formatCurrency(service.priceMinor, service.currency ?? "USD")}
				</Text>
			) : null}
		</Card>
	);
}

function formatCurrency(valueMinor: number, currency: string) {
	const amount = valueMinor / 100;
	return `${currency} ${amount.toFixed(2)}`;
}
