import { Avatar } from "@/components/ui/avatar";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Clique } from "@/types";

interface CliqueCardProps {
	clique: Clique;
}

export function CliqueCard({ clique }: CliqueCardProps) {
	return (
		<Box
			backgroundColor="card"
			borderRadius="m"
			padding="m"
			marginBottom="s"
			borderWidth={1}
			borderColor="border"
		>
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
					<Text variant="caption" color="muted-foreground">
						{clique.privacy === "private" ? "🔒 Private" : "🌐 Public"}
						{clique.isOwner && " • Owner"}
						{clique.isMember && !clique.isOwner && " • Member"}
					</Text>
				</Box>
			</Box>

			{/* Clique Description */}
			{clique.description && (
				<Text variant="body" marginBottom="s" numberOfLines={2}>
					{clique.description}
				</Text>
			)}

			{/* Clique Stats */}
			<Box flexDirection="row" justifyContent="space-between">
				<Text variant="caption" color="muted-foreground">
					👥 {clique.memberCount || 0} members
				</Text>
				<Text variant="caption" color="muted-foreground">
					{clique.timezone}
				</Text>
			</Box>
		</Box>
	);
}
