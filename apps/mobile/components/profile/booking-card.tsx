import { Box, Text } from "@/components/ui/restyle-components";
import type { Booking } from "@/types";

interface BookingCardProps {
	booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
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
		<Box
			backgroundColor="card"
			borderRadius="m"
			padding="m"
			marginBottom="s"
			borderWidth={1}
			borderColor="border"
		>
			{/* Booking Header */}
			<Box
				flexDirection="row"
				justifyContent="space-between"
				alignItems="flex-start"
				marginBottom="s"
			>
				<Box flex={1}>
					<Text variant="body" fontWeight="600" numberOfLines={1}>
						{booking.service?.title || "Service"}
					</Text>
					<Text variant="caption" color="muted-foreground" numberOfLines={1}>
						{booking.clique?.name || "Clique"}
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
				<Text variant="caption" color="muted-foreground">
					📅 {formatDate(startDate)}
				</Text>
				<Text variant="caption" color="muted-foreground">
					⏱️ Duration: {booking.service?.durationMinutes || 0} minutes
				</Text>
			</Box>

			{/* Price */}
			{booking.service?.priceMinor && (
				<Text variant="body" fontWeight="600" color="primary">
					€{(booking.service.priceMinor / 100).toFixed(2)}
				</Text>
			)}

			{/* Notes */}
			{booking.note && (
				<Box marginTop="s" padding="s" backgroundColor="muted" borderRadius="s">
					<Text variant="caption" fontStyle="italic">
						"{booking.note}"
					</Text>
				</Box>
			)}
		</Box>
	);
}
