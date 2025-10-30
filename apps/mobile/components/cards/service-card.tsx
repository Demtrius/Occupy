import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Service } from "@/types";

interface ServiceCardProps {
	service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
	const theme = useTheme<Theme>();

	return (
		<Card variant="elevated" marginBottom="s" rowGap="s">
			<Text variant="body" fontWeight="600">
				{service.title}
			</Text>
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
