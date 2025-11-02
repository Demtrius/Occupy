import { useTheme } from "@shopify/restyle";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";
import { AvailabilityCard } from "@/components/cards/availability-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Box } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Availability } from "@/types";
import { CreateAvailabilityModal } from "./create-availability-modal";

interface CliqueAvailabilityTabProps {
	cliqueId: string;
	availability: Availability[];
	isOwner: boolean;
	defaultTimezone?: string | null;
	onAvailabilityCreated?: (availability: Availability) => void;
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
	isLoading,
	onLoadMore,
	isFetchingMore,
}: CliqueAvailabilityTabProps) {
	const theme = useTheme<Theme>();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleOpenModal = useCallback(() => {
		setIsModalOpen(true);
	}, []);

	const handleCloseModal = useCallback(() => {
		setIsModalOpen(false);
	}, []);

	const handleCreated = useCallback(
		(slot: Availability) => {
			onAvailabilityCreated?.(slot);
		},
		[onAvailabilityCreated],
	);

	const renderItem = useCallback(
		({ item }: { item: Availability }) => (
			<AvailabilityCard
				availability={item}
				isOwner={isOwner}
				onMenuPress={() => {
					// TODO: Add edit/delete actions
				}}
			/>
		),
		[isOwner],
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
					onClose={handleCloseModal}
					onCreated={handleCreated}
				/>
			) : null}
		</>
	);
}
