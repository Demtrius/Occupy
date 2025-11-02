import { useTheme } from "@shopify/restyle";
import { ActivityIndicator, FlatList } from "react-native";
import { ServiceCard } from "@/components/cards/service-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Box } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Service } from "@/types";

interface CliqueServicesTabProps {
	services: Service[];
	isOwner: boolean;
	onCreateService?: () => void;
	isLoading: boolean;
}

export function CliqueServicesTab({
	services,
	isOwner,
	onCreateService,
	isLoading,
}: CliqueServicesTabProps) {
	const theme = useTheme<Theme>();

	const renderItem = ({ item }: { item: Service }) => (
		<ServiceCard service={item} />
	);

	const ListHeaderComponent = () =>
		isOwner ? (
			<Button
				variant="primary"
				onPress={onCreateService}
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
		<FlatList
			data={services}
			renderItem={renderItem}
			keyExtractor={(item) => item.id}
			ListHeaderComponent={ListHeaderComponent}
			ListEmptyComponent={ListEmptyComponent}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ padding: theme.spacing.m }}
		/>
	);
}
