import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Pressable } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Clique } from "@/types";

interface CliqueCardProps {
	clique: Clique;
	onPress?: () => void;
}

export function CliqueCard({ clique, onPress }: CliqueCardProps) {
	const theme = useTheme<Theme>();
	const memberCount = clique.membersCount ?? 0;
	const memberLabel = memberCount === 1 ? "member" : "members";

	return (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
			style={({ pressed }) => [
				{
					opacity: onPress ? (pressed ? 0.95 : 1) : 1,
					marginBottom: theme.spacing.m,
				},
			]}
		>
			<Card variant="elevated">
				{/* Clique Header */}
				<Box flexDirection="row" alignItems="center" marginBottom="s">
					<Avatar
						size={40}
						source={clique.imageUrl ? { uri: clique.imageUrl } : undefined}
					/>
					<Box marginLeft="s" flex={1}>
						<Text variant="body" fontWeight="600" numberOfLines={1}>
							{clique.name}
						</Text>
						<Box flexDirection="row" alignItems="center">
							<Ionicons
								name={
									clique.privacy === "private"
										? "lock-closed-outline"
										: "globe-outline"
								}
								size={16}
								color={theme.colors["muted-foreground"]}
							/>
							<Text variant="caption" color="muted-foreground" marginLeft="xs">
								{clique.privacy === "private" ? "Private" : "Public"}
							</Text>
						</Box>
					</Box>
				</Box>

				{/* Clique Description */}
				{clique.description ? (
					<Text variant="body" marginBottom="s" numberOfLines={2}>
						{clique.description}
					</Text>
				) : null}

				{/* Clique Stats */}
				<Box flexDirection="row" justifyContent="space-between">
					<Box flexDirection="row" alignItems="center">
						<Ionicons
							name="people-outline"
							size={16}
							color={theme.colors["muted-foreground"]}
						/>
						<Text variant="caption" color="muted-foreground" marginLeft="xs">
							{`${memberCount.toLocaleString()} ${memberLabel}`}
						</Text>
					</Box>
					<Text variant="caption" color="muted-foreground">
						{clique.timezone}
					</Text>
				</Box>
			</Card>
		</Pressable>
	);
}
