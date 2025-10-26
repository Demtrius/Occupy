import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { Screen } from "@/components/ui/screen";
import { Box, Text } from "@/components/ui/restyle-components";

export default function FollowingPage() {
	const { userId } = useLocalSearchParams<{ userId?: string }>();

	return (
		<Screen>
			<ScrollView showsVerticalScrollIndicator={false}>
				<Box paddingVertical="l" alignItems="center">
					<Text variant="header" marginBottom="l">
						Following
					</Text>

					<Box
						backgroundColor="muted"
						padding="l"
						borderRadius="m"
						width="100%"
					>
						<Text variant="body" textAlign="center">
							Following list will be implemented here
						</Text>
						<Text variant="caption" textAlign="center" marginTop="s">
							User ID: {userId || "current user"}
						</Text>
					</Box>
				</Box>
			</ScrollView>
		</Screen>
	);
}
