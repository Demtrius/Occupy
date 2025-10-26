import { Screen } from "@/components/ui/screen";
import { Button } from "./button";
import { Box, Text } from "./restyle-components";

interface ErrorScreenProps {
	message: string;
	onRetry?: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
	return (
		<Screen centerContent>
			<Box flex={1} alignItems="center" justifyContent="center" padding="l">
				<Text variant="body" textAlign="center" marginBottom="m">
					{message}
				</Text>
				{onRetry && <Button onPress={onRetry}>Try Again</Button>}
			</Box>
		</Screen>
	);
}
