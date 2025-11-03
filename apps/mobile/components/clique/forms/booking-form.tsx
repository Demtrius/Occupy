import { useState } from "react";
import { ScrollView } from "react-native";
import DatePicker from "react-native-date-picker";
import { Button } from "@/components/ui/button";
import { Box, Text } from "@/components/ui/restyle-components";
import { useListAvailableSlotsQuery } from "@/hooks/use-slots";
import type { Service } from "@/types";

interface BookingFormProps {
	service: Service;
	cliqueId: string;
	onSubmit: (startDateTime: Date) => void;
	isLoading: boolean;
}

export function BookingForm({
	service,
	cliqueId,
	onSubmit,
	isLoading,
}: BookingFormProps) {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);

	// Query available slots for selected date
	const from = new Date(selectedDate);
	from.setHours(0, 0, 0, 0);
	const to = new Date(selectedDate);
	to.setHours(23, 59, 59, 999);

	const { data: slotsResponse, isLoading: isLoadingSlots } =
		useListAvailableSlotsQuery(
			cliqueId,
			service.id,
			from.toISOString(),
			to.toISOString(),
		);

	const slotsData = slotsResponse?.slots || [];

	const handleCreateBooking = () => {
		if (!selectedTime) {
			return;
		}

		const startDateTime = new Date(selectedTime);

		if (Number.isNaN(startDateTime.getTime())) {
			return;
		}

		onSubmit(startDateTime);
	};

	const handleDateChange = (date: Date) => {
		setSelectedDate(date);
		setSelectedTime(null); // Reset selected time when date changes
	};

	return (
		<>
			<Box gap="m">
				<Box>
					<Text variant="body" fontWeight="600" marginBottom="s">
						Service
					</Text>
					<Text variant="body" color="muted-foreground">
						{service.title}
					</Text>
					<Text variant="caption" color="muted-foreground">
						{service.durationMinutes ?? 0} minutes
					</Text>
					{service.priceMinor != null && (
						<Text variant="body" color="primary" fontWeight="600">
							{formatCurrency(service.priceMinor!, service.currency ?? "USD")}
						</Text>
					)}
				</Box>

				<Box>
					<Text variant="body" fontWeight="600" marginBottom="s">
						Date
					</Text>
					<Button variant="secondary" onPress={() => setShowDatePicker(true)}>
						{selectedDate.toLocaleDateString()}
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
											onPress={() => setSelectedTime(slot.startTs)}
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
					onPress={handleCreateBooking}
					disabled={isLoading || !selectedTime}
				>
					{isLoading ? "Booking..." : "Confirm Booking"}
				</Button>
			</Box>

			<DatePicker
				modal
				open={showDatePicker}
				date={selectedDate}
				mode="date"
				onConfirm={(date) => {
					handleDateChange(date);
					setShowDatePicker(false);
				}}
				onCancel={() => {
					setShowDatePicker(false);
				}}
			/>
		</>
	);
}

function formatCurrency(valueMinor: number, currency: string) {
	const amount = valueMinor / 100;
	return `${currency} ${amount.toFixed(2)}`;
}
