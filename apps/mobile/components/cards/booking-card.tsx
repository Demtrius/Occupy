import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Booking } from "@/types";

interface BookingCardProps {
	booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
	const theme = useTheme<Theme>();
	const startDate = new Date(booking.startTs);
	const _endDate = new Date(booking.endTs);

	const formatDate = (date: Date) => {
		return (
			date.toLocaleDateString() +
			" " +
			date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			})
		);
	};

	const getStatusColor = (status: Booking["status"]) => {
		switch (status) {
			case "pending":
				return "primary";
			case "confirmed":
				return "primary";
			case "completed":
				return "secondary";
			case "cancelled":
				return "destructive";
			default:
				return "muted";
		}
	};

	return (
		<Card variant="elevated" marginBottom="m">
			{/* Booking Header */}
			<Box
				flexDirection="row"
				justifyContent="space-between"
				alignItems="flex-start"
				marginBottom="s"
			>
				<Box flex={1}>
					<Text variant="body" fontWeight="600" numberOfLines={1}>
						Service
					</Text>
					<Text variant="caption" color="muted-foreground" numberOfLines={1}>
						Clique
					</Text>
				</Box>
				<Box
					backgroundColor={getStatusColor(booking.status)}
					paddingHorizontal="s"
					paddingVertical="xs"
					borderRadius="s"
				>
					<Text variant="caption" color="card-foreground" fontWeight="500">
						{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
					</Text>
				</Box>
			</Box>

			{/* Booking Time */}
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
						60 minutes
					</Text>
				</Box>
			</Box>

			{/* Price */}
			<Text variant="body" fontWeight="600" color="primary">
				€50.00
			</Text>

			{/* Notes */}
			{booking.note && (
				<Box marginTop="s" padding="s" backgroundColor="muted" borderRadius="s">
					<Text variant="caption" fontStyle="italic">
						"{booking.note}"
					</Text>
				</Box>
			)}
		</Card>
	);
}
