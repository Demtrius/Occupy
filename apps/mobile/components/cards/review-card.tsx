import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Box, Card, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import type { Review } from "@/types";

interface ReviewCardProps {
	review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
	const theme = useTheme<Theme>();
	const createdAt = new Date(review.createdAt);

	return (
		<Card variant="elevated" marginBottom="m">
			<Box flexDirection="row" alignItems="center" marginBottom="s">
				<Ionicons name="star" size={16} color={theme.colors.primary} />
				<Text variant="body" fontWeight="600" marginLeft="xs">
					{review.rating}/5
				</Text>
				<Text variant="caption" color="muted-foreground" marginLeft="s">
					{createdAt.toLocaleDateString()}
				</Text>
			</Box>
			{review.comment ? (
				<Text variant="body" color="foreground">
					{review.comment}
				</Text>
			) : (
				<Text variant="caption" color="muted-foreground">
					No comment provided.
				</Text>
			)}
		</Card>
	);
}
