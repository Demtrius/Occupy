import { useState } from "react";
import { Alert, ScrollView } from "react-native";
import DatePicker from "react-native-date-picker";
import { Button } from "@/components/ui/button";
import { AppModal } from "@/components/ui/modal";
import { Box, Text } from "@/components/ui/restyle-components";
import { useListAvailableSlotsQuery } from "@/hooks/use-slots";
import type { Booking } from "@/types";

interface RescheduleBookingModalProps {
	visible: boolean;
	onClose: () => void;
	onReschedule: (newStartTime: Date) => void;
	booking: Booking | null;
	isLoading?: boolean;
}

export function RescheduleBookingModal({
	visible,
	onClose,
	onReschedule,
	booking,
	isLoading = false,
}: RescheduleBookingModalProps) {
	// Default to current booking time for initial selection
	const currentStartTime = booking ? new Date(booking.startTs) : new Date();
	const [selectedDate, setSelectedDate] = useState(currentStartTime);
	const [selectedTime, setSelectedTime] = useState<string | null>(
		currentStartTime.toISOString(),
	);
	const [showDatePicker, setShowDatePicker] = useState(false);

	// Query available slots for selected date and service
	const from = new Date(selectedDate);
	from.setHours(0, 0, 0, 0);
	const to = new Date(selectedDate);
	to.setHours(23, 59, 59, 999);

	const { data: slotsResponse, isLoading: isLoadingSlots } =
		useListAvailableSlotsQuery(
			booking?.clique?.id,
			booking?.service?.id ?? "",
			from.toISOString(),
			to.toISOString(),
		);

	const slotsData = (slotsResponse?.slots || []).filter(
		(slot) => new Date(slot.startTs) >= currentStartTime,
	);

	const handleDateChange = (date: Date) => {
		setSelectedDate(date);
		// Reset selected time when date changes
		setSelectedTime(null);
	};

	const handleTimeSelect = (slotTime: string) => {
		setSelectedTime(slotTime);
	};

	const handleReschedule = () => {
		if (!selectedTime) {
			Alert.alert("Select Time", "Please select a time slot.");
			return;
		}

		try {
			const newStartTime = new Date(selectedTime);

			if (Number.isNaN(newStartTime.getTime())) {
				Alert.alert("Invalid Date", "Please select a valid date and time.");
				return;
			}

			// Check if new time is before the original booking time
			if (newStartTime < currentStartTime) {
				Alert.alert(
					"Invalid Time",
					"Cannot reschedule to an earlier time than the original booking.",
				);
				return;
			}

			onReschedule(newStartTime);
			setSelectedTime(null);
			onClose();
		} catch (_error) {
			Alert.alert("Error", "Invalid date or time format.");
		}
	};

	const _formatTimeDisplay = (timeString: string) => {
		const date = new Date(timeString);
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDateDisplay = (date: Date) => {
		return date.toLocaleDateString([], {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	};

	if (!booking) return null;

	return (
		<AppModal visible={visible} onClose={onClose} title="Reschedule Booking">
			<Box gap="m">
				<Box>
					<Text variant="body" fontWeight="600" marginBottom="s">
						Current Booking
					</Text>
					<Text variant="body" color="muted-foreground">
						{booking.service?.title || "Service"}
					</Text>
					<Text variant="caption" color="muted-foreground">
						{booking.service?.durationMinutes ?? 0} minutes
					</Text>
					<Text variant="body" color="muted-foreground">
						Currently scheduled for {currentStartTime.toLocaleDateString()} at{" "}
						{currentStartTime.toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</Text>
				</Box>

				<Box>
					<Text variant="body" fontWeight="600" marginBottom="s">
						New Date
					</Text>
					<Button variant="secondary" onPress={() => setShowDatePicker(true)}>
						{formatDateDisplay(selectedDate)}
					</Button>
				</Box>

				<Box>
					<Text variant="body" fontWeight="600" marginBottom="s">
						Available Time Slots
					</Text>
					{isLoadingSlots ? (
						<Text variant="body" color="muted-foreground">
							Loading available slots...
						</Text>
					) : slotsData && slotsData.length > 0 ? (
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							<Box flexDirection="row" gap="s">
								{slotsData.map((slot) => {
									const startDate = new Date(slot.startTs);
									const timeString = startDate.toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									});
									return (
										<Button
											key={slot.startTs}
											variant={
												selectedTime === slot.startTs ? "primary" : "secondary"
											}
											onPress={() => handleTimeSelect(slot.startTs)}
											style={{ minWidth: 80 }}
										>
											{timeString}
										</Button>
									);
								})}
							</Box>
						</ScrollView>
					) : (
						<Text variant="body" color="muted-foreground">
							No available slots for this date
						</Text>
					)}
				</Box>
			</Box>

			<Box marginTop="s" gap="s">
				<Button
					variant="primary"
					onPress={handleReschedule}
					disabled={isLoading || !selectedTime}
				>
					{isLoading ? "Rescheduling..." : "Reschedule Booking"}
				</Button>
			</Box>

			<DatePicker
				modal
				open={showDatePicker}
				date={selectedDate}
				mode="date"
				minimumDate={currentStartTime}
				onConfirm={(date) => {
					handleDateChange(date);
					setShowDatePicker(false);
				}}
				onCancel={() => {
					setShowDatePicker(false);
				}}
			/>
		</AppModal>
	);
}
