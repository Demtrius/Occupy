import { useTheme } from "@shopify/restyle";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList } from "react-native";
import { AvailabilityCard } from "@/components/cards/availability-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Box } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import { useDeleteAvailabilityMutation } from "@/hooks/use-availability";
import { getErrorMessage } from "@/lib/error-utils";
import { presentOverflowMenu } from "@/lib/overflow-menu";
import { showToast } from "@/stores/toast-store";
import type { Availability } from "@/types";
import { CreateAvailabilityModal } from "./create-availability-modal";

interface CliqueAvailabilityTabProps {
	cliqueId: string;
	availability: Availability[];
	isOwner: boolean;
	defaultTimezone?: string | null;
	onAvailabilityCreated?: (availability: Availability) => void;
	onAvailabilityUpdated?: (availability: Availability) => void;
	onAvailabilityDeleted?: (availabilityId: string) => void;
	isLoading: boolean;
	onLoadMore?: () => void;
	isFetchingMore?: boolean;
}

export function CliqueAvailabilityTab({
	cliqueId,
	availability,
	isOwner,
	defaultTimezone,
	onAvailabilityCreated,
	onAvailabilityUpdated,
	onAvailabilityDeleted,
	isLoading,
	onLoadMore,
	isFetchingMore,
}: CliqueAvailabilityTabProps) {
	const theme = useTheme<Theme>();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [editingAvailability, setEditingAvailability] =
		useState<Availability | null>(null);

	const deleteAvailabilityMutation = useDeleteAvailabilityMutation();

	const handleOpenModal = useCallback(() => {
		setModalMode("create");
		setEditingAvailability(null);
		setIsModalOpen(true);
	}, []);

	const handleCloseModal = useCallback(() => {
		setIsModalOpen(false);
		setEditingAvailability(null);
	}, []);

	const handleCreated = useCallback(
		(slot: Availability) => {
			onAvailabilityCreated?.(slot);
		},
		[onAvailabilityCreated],
	);

	const handleUpdated = useCallback(
		(slot: Availability) => {
			onAvailabilityUpdated?.(slot);
		},
		[onAvailabilityUpdated],
	);

	const confirmDelete = useCallback(
		(slot: Availability) => {
			Alert.alert(
				"Delete Availability",
				"Are you sure you want to delete this availability slot?",
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Delete",
						style: "destructive",
						onPress: async () => {
							try {
								await deleteAvailabilityMutation.mutateAsync({
									params: {
										path: { availabilityId: slot.id },
									},
								});
								showToast({
									type: "success",
									message: "Availability deleted",
								});
								onAvailabilityDeleted?.(slot.id);
							} catch (error: unknown) {
								showToast({
									type: "error",
									message: getErrorMessage(
										error,
										"Failed to delete availability",
									),
								});
							}
						},
					},
				],
			);
		},
		[deleteAvailabilityMutation, onAvailabilityDeleted],
	);

	const handleMenuPress = useCallback(
		(slot: Availability) => {
			presentOverflowMenu([
				{
					label: "Edit",
					onPress: () => {
						setModalMode("edit");
						setEditingAvailability(slot);
						setIsModalOpen(true);
					},
				},
				{
					label: "Delete",
					destructive: true,
					onPress: () => confirmDelete(slot),
				},
			]);
		},
		[confirmDelete],
	);

	const renderItem = useCallback(
		({ item }: { item: Availability }) => (
			<AvailabilityCard
				availability={item}
				isOwner={isOwner}
				onMenuPress={() => handleMenuPress(item)}
			/>
		),
		[handleMenuPress, isOwner],
	);

	const keyExtractor = useCallback((item: Availability) => item.id, []);

	const handleEndReached = useCallback(() => {
		if (!onLoadMore || isFetchingMore || isLoading) return;
		onLoadMore();
	}, [isFetchingMore, isLoading, onLoadMore]);

	const listHeader = useMemo(() => {
		if (!isOwner) {
			return <Box />;
		}
		return (
			<Box marginBottom="m">
				<Button
					variant="primary"
					onPress={handleOpenModal}
					disabled={!cliqueId}
				>
					Create Availability
				</Button>
			</Box>
		);
	}, [cliqueId, handleOpenModal, isOwner]);

	const listEmpty = useCallback(() => {
		if (isLoading) {
			return (
				<Box flex={1} alignItems="center" justifyContent="center" padding="xl">
					<ActivityIndicator color={theme.colors.primary} />
				</Box>
			);
		}
		return (
			<Box flex={1} alignItems="center" justifyContent="center" padding="xl">
				<EmptyState message="No availability published yet." />
			</Box>
		);
	}, [isLoading, theme.colors.primary]);

	const listFooter = useMemo(() => {
		if (!isFetchingMore) return null;
		return (
			<Box alignItems="center" paddingVertical="m">
				<ActivityIndicator color={theme.colors.primary} />
			</Box>
		);
	}, [isFetchingMore, theme.colors.primary]);

	return (
		<>
			<FlatList
				data={availability}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				ListHeaderComponent={listHeader}
				ListEmptyComponent={listEmpty}
				ListFooterComponent={listFooter}
				onEndReached={handleEndReached}
				onEndReachedThreshold={0.5}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: theme.spacing.m,
					paddingBottom: theme.spacing.m,
					paddingTop: theme.spacing.m,
					flexGrow: availability.length === 0 ? 1 : undefined,
				}}
			/>
			{isOwner ? (
				<CreateAvailabilityModal
					visible={isModalOpen}
					cliqueId={cliqueId}
					defaultTimezone={defaultTimezone}
					mode={modalMode}
					availability={editingAvailability}
					onClose={handleCloseModal}
					onCreated={handleCreated}
					onUpdated={handleUpdated}
				/>
			) : null}
		</>
	);
}
