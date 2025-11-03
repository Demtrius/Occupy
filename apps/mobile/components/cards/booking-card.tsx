import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { useState } from "react";
import { Alert } from "react-native";
import { CancelBookingModal } from "@/components/booking/cancel-booking-modal";
import { ConfirmBookingModal } from "@/components/booking/confirm-booking-modal";
import { RescheduleBookingModal } from "@/components/booking/reschedule-booking-modal";
import { Button } from "@/components/ui/button";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Booking, BookingStatus } from "@/types";

interface BookingCardProps {
	booking: Booking;
	currentUserId?: string;
	isCliqueOwner?: boolean;
	cliqueCancellationCutoffHours?: number;
	onConfirm?: (bookingId: string) => void;
	onCancel?: (bookingId: string, reason?: string) => void;
	onReschedule?: (bookingId: string, newStartTime: Date) => void;
	onReview?: (bookingId: string) => void;
}

function formatCurrency(valueMinor: number, currency: string) {
	const amount = valueMinor / 100;
	return `${currency} ${amount.toFixed(2)}`;
}

export function BookingCard({
	booking,
	currentUserId,
	isCliqueOwner,
	cliqueCancellationCutoffHours = 24,
	onConfirm,
	onCancel,
	onReschedule,
	onReview,
}: BookingCardProps) {
	const theme = useTheme<Theme>();
	const [confirmModalVisible, setConfirmModalVisible] = useState(false);
	const [cancelModalVisible, setCancelModalVisible] = useState(false);
	const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

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

	// Calculate if modifications are allowed
	const now = new Date();
	const bookingStartTime = new Date(booking.startTs);
	const cutoffTime = new Date(bookingStartTime);
	cutoffTime.setHours(
		cutoffTime.getHours() - (cliqueCancellationCutoffHours || 24),
	);

	const canModify = booking.status === "confirmed" && now < cutoffTime;
	const isBooker = currentUserId === booking.userId;
	const canConfirm = booking.status === "pending" && isCliqueOwner;
	const canReview = booking.status === "completed" && isBooker;

	const handleConfirm = () => {
		setIsLoading(true);
		onConfirm?.(booking.id);
		setConfirmModalVisible(false);
		setIsLoading(false);
	};

	const handleCancel = (reason: string) => {
		setIsLoading(true);
		onCancel?.(booking.id, reason);
		setCancelModalVisible(false);
		setIsLoading(false);
	};

	const handleReschedule = (newStartTime: Date) => {
		setIsLoading(true);
		onReschedule?.(booking.id, newStartTime);
		setRescheduleModalVisible(false);
		setIsLoading(false);
	};

	const handleReview = () => {
		if (onReview) {
			onReview(booking.id);
		} else {
			// Show placeholder toast for now
			Alert.alert(
				"Reviews Coming Soon",
				"The review feature will be available in a future update.",
			);
		}
	};

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
						"{booking.note}"
					</Text>
				</Box>
			) : null}

			{/* Action Buttons */}
			{(canConfirm || canModify || canReview) && (
				<Box flexDirection="row" gap="s" marginTop="m">
					{canConfirm && (
						<Button
							variant="primary"
							onPress={() => setConfirmModalVisible(true)}
							style={{ flex: 1 }}
						>
							Confirm Booking
						</Button>
					)}

					{canModify && (
						<>
							<Button
								variant="secondary"
								onPress={() => setRescheduleModalVisible(true)}
								style={{ flex: 1 }}
							>
								Reschedule
							</Button>
							<Button
								variant="secondary"
								onPress={() => setCancelModalVisible(true)}
								style={{ flex: 1 }}
							>
								Cancel
							</Button>
						</>
					)}

					{canReview && (
						<Button
							variant="secondary"
							onPress={handleReview}
							style={{ flex: 1 }}
						>
							Leave Review
						</Button>
					)}
				</Box>
			)}

			{/* Modals */}
			<ConfirmBookingModal
				visible={confirmModalVisible}
				onClose={() => setConfirmModalVisible(false)}
				onConfirm={handleConfirm}
				booking={booking}
				isLoading={isLoading}
			/>

			<CancelBookingModal
				visible={cancelModalVisible}
				onClose={() => setCancelModalVisible(false)}
				onCancel={handleCancel}
				booking={booking}
				isLoading={isLoading}
			/>

			<RescheduleBookingModal
				visible={rescheduleModalVisible}
				onClose={() => setRescheduleModalVisible(false)}
				onReschedule={handleReschedule}
				booking={booking}
				isLoading={isLoading}
			/>
		</Card>
	);
}
