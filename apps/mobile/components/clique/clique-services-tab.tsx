import { useTheme } from "@shopify/restyle";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList } from "react-native";
import { ServiceCard } from "@/components/cards/service-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Box } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Service } from "@/types";
import { CreateServiceModal } from "./create-service-modal";

interface CliqueServicesTabProps {
	cliqueId: string;
	services: Service[];
	isOwner: boolean;
	defaultCurrency?: string | null;
	onServiceCreated?: (service: Service) => void;
	isLoading: boolean;
}

export function CliqueServicesTab({
	cliqueId,
	services,
	isOwner,
	defaultCurrency,
	onServiceCreated,
	isLoading,
}: CliqueServicesTabProps) {
	const theme = useTheme<Theme>();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleOpenModal = useCallback(() => {
		setIsModalOpen(true);
	}, []);

	const handleCloseModal = useCallback(() => {
		setIsModalOpen(false);
	}, []);

	const handleCreated = useCallback(
		(service: Service) => {
			onServiceCreated?.(service);
		},
		[onServiceCreated],
	);

	const renderItem = ({ item }: { item: Service }) => (
		<ServiceCard service={item} />
	);

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
				keyExtractor={(item) => item.id}
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
					onClose={handleCloseModal}
					onCreated={handleCreated}
				/>
			) : null}
		</>
	);
}
