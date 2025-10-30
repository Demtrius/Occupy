import { Ionicons } from "@expo/vector-icons";
import { type ColorProps, useTheme } from "@shopify/restyle";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Booking, BookingStatus } from "@/types";

interface BookingCardProps {
	booking: Booking;
}

function formatCurrency(valueMinor: number, currency: string) {
	const amount = valueMinor / 100;
	return `${currency} ${amount.toFixed(2)}`;
}

export function BookingCard({ booking }: BookingCardProps) {
	const theme = useTheme<Theme>();
	const startDate = new Date(booking.startTs);
	const endDate = new Date(booking.endTs);

	const serviceTitle = booking.service?.title ?? "Service";
	const cliqueName = booking.clique?.name ?? undefined;
	const durationMinutes =
		booking.service?.durationMinutes ??
		Math.max(Math.round((endDate.getTime() - startDate.getTime()) / 60000), 0);
	const priceMinor = booking.service?.priceMinor ?? null;
	const currency = booking.service?.currency ?? "EUR";
	const statusLabel =
		booking.status.charAt(0).toUpperCase() + booking.status.slice(1);

	const formatDate = (date: Date) =>
		`${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		})}`;

	const getStatusBadgeColors = (
		status: BookingStatus,
	): {
		background: keyof Theme["colors"];
		text: keyof Theme["colors"];
	} => {
		switch (status) {
			case "pending":
			case "confirmed":
				return {
					background: "primary",
					text: "primary-foreground",
				};
			case "completed":
				return {
					background: "secondary",
					text: "secondary-foreground",
				};
			case "cancelled":
				return {
					background: "destructive",
					text: "primary-foreground",
				};
			default:
				return {
					background: "muted",
					text: "muted-foreground",
				};
		}
	};

	const badgeColors = getStatusBadgeColors(booking.status);

	return (
		<Card variant="elevated" marginBottom="m">
			<Box
				flexDirection="row"
				justifyContent="space-between"
				alignItems="flex-start"
				marginBottom="s"
			>
				<Box flex={1} marginRight="s">
					<Text variant="body" fontWeight="600" numberOfLines={1}>
						{serviceTitle}
					</Text>
					{cliqueName ? (
						<Text variant="caption" color="muted-foreground" numberOfLines={1}>
							{cliqueName}
						</Text>
					) : null}
				</Box>
				<Box
					backgroundColor={badgeColors.background}
					paddingHorizontal="s"
					paddingVertical="xs"
					borderRadius="s"
				>
					<Text
						style={{ fontSize: 14 }}
						color={badgeColors.text}
						fontWeight="500"
					>
						{statusLabel}
					</Text>
				</Box>
			</Box>

			<Box marginBottom="s">
				<Box flexDirection="row" alignItems="center" marginBottom="xs">
					<Ionicons
						name="calendar-outline"
						size={16}
						color={theme.colors["muted-foreground"]}
					/>
					<Text variant="caption" color="muted-foreground" marginLeft="xs">
						{formatDate(startDate)}
					</Text>
				</Box>
				<Box flexDirection="row" alignItems="center">
					<Ionicons
						name="time-outline"
						size={16}
						color={theme.colors["muted-foreground"]}
					/>
					<Text variant="caption" color="muted-foreground" marginLeft="xs">
						{`${durationMinutes} minutes`}
					</Text>
				</Box>
			</Box>

			{priceMinor !== null ? (
				<Text variant="body" fontWeight="600" color="primary">
					{formatCurrency(priceMinor, currency)}
				</Text>
			) : null}

			{booking.note ? (
				<Box marginTop="s" padding="s" backgroundColor="muted" borderRadius="s">
					<Text variant="caption" fontStyle="italic">
						“{booking.note}”
					</Text>
				</Box>
			) : null}
		</Card>
	);
}
