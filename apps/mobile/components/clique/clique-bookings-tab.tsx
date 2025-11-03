import { useTheme } from "@shopify/restyle";
import { ActivityIndicator, FlatList } from "react-native";
import { BookingCard } from "@/components/cards/booking-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Booking } from "@/types";

interface CliqueBookingsTabProps {
	bookings: Booking[];
	isOwner: boolean;
	currentUserId?: string;
	onEndReached: () => void;
	isLoading: boolean;
	isFetchingMore: boolean;
	cliqueCancellationCutoffHours?: number;
	onConfirm?: (bookingId: string) => void;
	onCancel?: (bookingId: string, reason?: string) => void;
	onReschedule?: (bookingId: string, newStartTime: Date) => void;
	onReview?: (bookingId: string) => void;
}

export function CliqueBookingsTab({
	bookings,
	isOwner,
	currentUserId,
	onEndReached,
	isLoading,
	isFetchingMore,
	cliqueCancellationCutoffHours = 24,
	onConfirm,
	onCancel,
	onReschedule,
	onReview,
}: CliqueBookingsTabProps) {
	const theme = useTheme<Theme>();

	const visibleBookings = isOwner
		? bookings
		: bookings.filter((booking) => booking.user?.id === currentUserId);

	const renderItem = ({ item }: { item: Booking }) => (
		<BookingCard
			booking={item}
			currentUserId={currentUserId}
			isCliqueOwner={isOwner}
			cliqueCancellationCutoffHours={cliqueCancellationCutoffHours}
			onConfirm={onConfirm}
			onCancel={onCancel}
			onReschedule={onReschedule}
			onReview={onReview}
		/>
	);

	const ListHeaderComponent = () => (
		<Box marginBottom="m">
			<Text variant="subheader" marginBottom="xs">
				Bookings
			</Text>
			<Text variant="caption" color="muted-foreground">
				{isOwner
					? "You can manage all bookings for this clique."
					: "You can see bookings you placed with this clique."}
			</Text>
		</Box>
	);

	const ListFooterComponent = () =>
		isFetchingMore ? (
			<Box alignItems="center" padding="m">
				<ActivityIndicator color={theme.colors.primary} />
			</Box>
		) : null;

	const ListEmptyComponent = () =>
		isLoading ? (
			<Box alignItems="center" padding="xl">
				<ActivityIndicator color={theme.colors.primary} />
			</Box>
		) : (
			<EmptyState message="No bookings yet." />
		);

	return (
		<FlatList
			data={visibleBookings}
			renderItem={renderItem}
			keyExtractor={(item) => item.id}
			ListHeaderComponent={ListHeaderComponent}
			ListFooterComponent={ListFooterComponent}
			ListEmptyComponent={ListEmptyComponent}
			onEndReached={onEndReached}
			onEndReachedThreshold={0.5}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ padding: theme.spacing.m }}
		/>
	);
}
