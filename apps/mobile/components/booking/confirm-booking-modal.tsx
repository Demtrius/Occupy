import { Button } from "@/components/ui/button";
import { AppModal } from "@/components/ui/modal";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Booking } from "@/types";

interface ConfirmBookingModalProps {
	visible: boolean;
	onClose: () => void;
	onConfirm: () => void;
	booking: Booking | null;
	isLoading?: boolean;
}

export function ConfirmBookingModal({
	visible,
	onClose,
	onConfirm,
	booking,
	isLoading = false,
}: ConfirmBookingModalProps) {
	const handleConfirm = () => {
		onConfirm();
		onClose();
	};

	if (!booking) return null;

	return (
		<AppModal visible={visible} onClose={onClose} title="Confirm Booking">
			<Box gap="m">
				<Text variant="body">
					Are you sure you want to confirm this booking with{" "}
					<Text variant="body" fontWeight="600">
						{booking.user?.fullName || booking.user?.username || "Client"}
					</Text>{" "}
					for{" "}
					<Text variant="body" fontWeight="600">
						{booking.service?.title || "Service"}
					</Text>
					?
				</Text>

				<Text variant="caption" color="muted-foreground">
					{new Date(booking.startTs).toLocaleDateString()} at{" "}
					{new Date(booking.startTs).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</Text>

				<Box flexDirection="row" gap="s" marginTop="l">
					<Button variant="secondary" onPress={onClose} style={{ flex: 1 }}>
						Cancel
					</Button>
					<Button
						variant="primary"
						onPress={handleConfirm}
						disabled={isLoading}
						style={{ flex: 1 }}
					>
						{isLoading ? "Confirming..." : "Confirm Booking"}
					</Button>
				</Box>
			</Box>
		</AppModal>
	);
}
