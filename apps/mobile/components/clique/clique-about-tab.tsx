import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert } from "react-native";
import { UserCard } from "@/components/cards/user-card";
import { Button } from "@/components/ui/button";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import { useDeleteCliqueMutation } from "@/hooks/use-cliques";
import { useMeQuery } from "@/hooks/use-users";
import type { Clique, User } from "@/types";

interface CliqueAboutTabProps {
	clique: Clique;
	owner?: User;
}

export function CliqueAboutTab({ clique, owner }: CliqueAboutTabProps) {
	const theme = useTheme<Theme>();
	const router = useRouter();
	const { data: currentUser } = useMeQuery();
	const deleteCliqueMutation = useDeleteCliqueMutation();

	const createdAt = new Date(clique.createdAt);
	const createdLabel = Number.isNaN(createdAt.getTime())
		? undefined
		: createdAt.toLocaleDateString(undefined, {
				year: "numeric",
				month: "long",
				day: "numeric",
			});

	const onOwnerPress = () => {
		if (owner) {
			router.push(`/(tabs)/profile#userId=${owner.id}`);
		}
	};

	const handleDeleteClique = () => {
		Alert.alert(
			"Delete Clique",
			"Are you sure you want to delete this clique? This action cannot be undone.",
			[
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Delete",
					style: "destructive",
					onPress: () => {
						deleteCliqueMutation.mutate(
							{
								params: { path: { cliqueId: clique.id } },
							},
							{
								onSuccess: () => {
									router.replace("/(tabs)/cliques");
								},
							},
						);
					},
				},
			],
		);
	};

	const isOwner = currentUser?.id === clique.ownerUserId;

	return (
		<Box padding="m" gap="m">
			<Box>
				<Text variant="subheader" marginBottom="s">
					About this clique
				</Text>
				<Text variant="body" color="muted-foreground">
					{clique.description ?? "No description provided yet."}
				</Text>
			</Box>

			<Box>
				<Text variant="subheader" marginBottom="s">
					Owner
				</Text>
				{owner ? (
					<UserCard user={owner} onPress={onOwnerPress} />
				) : (
					<Box alignItems="center" padding="m">
						<ActivityIndicator color={theme.colors.primary} />
					</Box>
				)}
			</Box>

			{createdLabel ? (
				<Box>
					<Text variant="subheader" marginBottom="s">
						Created
					</Text>
					<Text variant="body" color="muted-foreground">
						{createdLabel}
					</Text>
				</Box>
			) : null}

			{isOwner && (
				<Box>
					<Text variant="subheader" marginBottom="s">
						Danger Zone
					</Text>
					<Button
						variant="primary"
						onPress={handleDeleteClique}
						disabled={deleteCliqueMutation.isPending}
					>
						{deleteCliqueMutation.isPending ? "Deleting..." : "Delete Clique"}
					</Button>
				</Box>
			)}
		</Box>
	);
}
