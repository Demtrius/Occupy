import { useTheme } from "@shopify/restyle";
import { ActivityIndicator } from "react-native";
import { AvailabilityCard } from "@/components/cards/availability-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Box } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Availability } from "@/types";

interface CliqueAvailabilityTabProps {
	availability: Availability[];
	isOwner: boolean;
	onCreateAvailability?: () => void;
	isLoading: boolean;
}

export function CliqueAvailabilityTab({
	availability,
	isOwner,
	onCreateAvailability,
	isLoading,
}: CliqueAvailabilityTabProps) {
	const theme = useTheme<Theme>();

	return (
		<Box padding="m" gap="m">
			{isOwner && (
				<Button
					variant="primary"
					onPress={onCreateAvailability}
					style={{ marginBottom: theme.spacing.m }}
				>
					Create Availability
				</Button>
			)}

			{isLoading ? (
				<Box alignItems="center" padding="xl">
					<ActivityIndicator color={theme.colors.primary} />
				</Box>
			) : availability.length === 0 ? (
				<EmptyState message="No availability published yet." />
			) : (
				availability.map((slot) => (
					<AvailabilityCard
						key={slot.id}
						availability={slot}
						isOwner={isOwner}
						onMenuPress={() => {
							// Handle menu press, e.g., show options to edit/delete
						}}
					/>
				))
			)}
		</Box>
	);
}
