import { useTheme } from "@shopify/restyle";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList } from "react-native";
import { ServiceCard } from "@/components/cards/service-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Box } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import { useDeleteServiceMutation } from "@/hooks/use-services";
import { getErrorMessage } from "@/lib/error-utils";
import { presentOverflowMenu } from "@/lib/overflow-menu";
import { showToast } from "@/stores/toast-store";
import type { Service } from "@/types";
import { CreateServiceModal } from "./create-service-modal";

interface CliqueServicesTabProps {
	cliqueId: string;
	services: Service[];
	isOwner: boolean;
	defaultCurrency?: string | null;
	onServiceCreated?: (service: Service) => void;
	onServiceUpdated?: (service: Service) => void;
	onServiceDeleted?: (serviceId: string) => void;
	isLoading: boolean;
}

export function CliqueServicesTab({
	cliqueId,
	services,
	isOwner,
	defaultCurrency,
	onServiceCreated,
	onServiceUpdated,
	onServiceDeleted,
	isLoading,
}: CliqueServicesTabProps) {
	const theme = useTheme<Theme>();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [editingService, setEditingService] = useState<Service | null>(null);

	const deleteServiceMutation = useDeleteServiceMutation();

	const handleOpenModal = useCallback(() => {
		setModalMode("create");
		setEditingService(null);
		setIsModalOpen(true);
	}, []);

	const handleCloseModal = useCallback(() => {
		setIsModalOpen(false);
		setEditingService(null);
	}, []);

	const handleCreated = useCallback(
		(service: Service) => {
			onServiceCreated?.(service);
		},
		[onServiceCreated],
	);

	const handleUpdated = useCallback(
		(service: Service) => {
			onServiceUpdated?.(service);
		},
		[onServiceUpdated],
	);

	const confirmDelete = useCallback(
		(service: Service) => {
			Alert.alert(
				"Delete Service",
				`Are you sure you want to delete “${service.title}”?`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Delete",
						style: "destructive",
						onPress: async () => {
							try {
								await deleteServiceMutation.mutateAsync({
									params: { path: { serviceId: service.id } },
								});
								showToast({
									type: "success",
									message: "Service deleted",
								});
								onServiceDeleted?.(service.id);
							} catch (error: unknown) {
								showToast({
									type: "error",
									message: getErrorMessage(error, "Failed to delete service"),
								});
							}
						},
					},
				],
			);
		},
		[deleteServiceMutation, onServiceDeleted],
	);

	const handleMenuPress = useCallback(
		(service: Service) => {
			presentOverflowMenu([
				{
					label: "Edit",
					onPress: () => {
						setModalMode("edit");
						setEditingService(service);
						setIsModalOpen(true);
					},
				},
				{
					label: "Delete",
					destructive: true,
					onPress: () => confirmDelete(service),
				},
			]);
		},
		[confirmDelete],
	);

	const renderItem = useCallback(
		({ item }: { item: Service }) => (
			<ServiceCard
				service={item}
				isOwner={isOwner}
				onMenuPress={() => handleMenuPress(item)}
			/>
		),
		[handleMenuPress, isOwner],
	);

	const keyExtractor = useCallback((item: Service) => item.id, []);

	const ListHeaderComponent = () =>
		isOwner ? (
			<Button
				variant="primary"
				onPress={handleOpenModal}
				disabled={!cliqueId}
				style={{ marginBottom: theme.spacing.m }}
			>
				Create Service
			</Button>
		) : null;

	const ListEmptyComponent = () =>
		isLoading ? (
			<Box alignItems="center" padding="xl">
				<ActivityIndicator color={theme.colors.primary} />
			</Box>
		) : (
			<EmptyState message="No services published yet." />
		);

	return (
		<>
			<FlatList
				data={services}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				ListHeaderComponent={ListHeaderComponent}
				ListEmptyComponent={ListEmptyComponent}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ padding: theme.spacing.m }}
			/>
			{isOwner ? (
				<CreateServiceModal
					visible={isModalOpen}
					cliqueId={cliqueId}
					defaultCurrency={defaultCurrency}
					mode={modalMode}
					service={editingService}
					onClose={handleCloseModal}
					onCreated={handleCreated}
					onUpdated={handleUpdated}
				/>
			) : null}
		</>
	);
}
