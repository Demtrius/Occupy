import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { UserCard } from "@/components/cards/user-card";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Clique, User } from "@/types";

interface CliqueAboutTabProps {
	clique: Clique;
	owner?: User;
}

export function CliqueAboutTab({ clique, owner }: CliqueAboutTabProps) {
	const theme = useTheme<Theme>();
	const router = useRouter();
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
		</Box>
	);
}
