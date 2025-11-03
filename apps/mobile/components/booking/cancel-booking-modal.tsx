import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppModal } from "@/components/ui/modal";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Booking } from "@/types";

interface CancelBookingModalProps {
	visible: boolean;
	onClose: () => void;
	onCancel: (reason: string) => void;
	booking: Booking | null;
	isLoading?: boolean;
}

export function CancelBookingModal({
	visible,
	onClose,
	onCancel,
	booking,
	isLoading = false,
}: CancelBookingModalProps) {
	const [reason, setReason] = useState("");

	const handleCancel = () => {
		if (!reason.trim()) {
			return;
		}

		onCancel(reason);
		setReason("");
		onClose();
	};

	if (!booking) return null;

	return (
		<AppModal visible={visible} onClose={onClose} title="Cancel Booking">
			<Box gap="m">
				<Text variant="body">
					Are you sure you want to cancel your booking for{" "}
					<Text variant="body" fontWeight="600">
						{booking.service?.title || "Service"}
					</Text>{" "}
					on{" "}
					<Text variant="body" fontWeight="600">
						{new Date(booking.startTs).toLocaleDateString()}
					</Text>
					?
				</Text>

				<Text variant="caption" color="muted-foreground" marginBottom="m">
					Please provide a reason for cancellation (optional for clients,
					required for owners)
				</Text>

				<Text variant="label" marginBottom="s">
					Cancellation Reason
				</Text>
				<Input
					value={reason}
					onChangeText={setReason}
					placeholder="e.g., Schedule conflict, emergency, etc."
					multiline
					numberOfLines={3}
					style={{ minHeight: 80 }}
				/>

				<Box flexDirection="row" gap="s" marginTop="l">
					<Button variant="secondary" onPress={onClose} style={{ flex: 1 }}>
						Keep Booking
					</Button>
					<Button
						variant="secondary"
						onPress={handleCancel}
						disabled={isLoading}
						style={{ flex: 1 }}
					>
						{isLoading ? "Cancelling..." : "Cancel Booking"}
					</Button>
				</Box>
			</Box>
		</AppModal>
	);
}
