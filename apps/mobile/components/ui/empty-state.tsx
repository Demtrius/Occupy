import { Box, Text } from "./restyle-components";

interface EmptyStateProps {
	message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
	return (
		<Box flex={1} alignItems="center" justifyContent="center" padding="m">
			<Text variant="body" color="muted-foreground" textAlign="center">
				{message}
			</Text>
		</Box>
	);
}
