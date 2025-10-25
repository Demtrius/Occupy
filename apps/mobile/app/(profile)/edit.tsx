import { ScrollView } from "react-native";
import { Screen } from "@/components/screen";
import { Box, Text } from "@/components/ui/restyle-components";

export default function EditProfilePage() {
	return (
		<Screen>
			<ScrollView showsVerticalScrollIndicator={false}>
				<Box paddingVertical="l" alignItems="center">
					<Text variant="header" marginBottom="l">
						Edit Profile
					</Text>

					<Box
						backgroundColor="muted"
						padding="l"
						borderRadius="m"
						width="100%"
					>
						<Text variant="body" textAlign="center">
							Profile editing form will be implemented here
						</Text>
						<Text variant="caption" textAlign="center" marginTop="s">
							Avatar upload, bio editing, occupation selection, etc.
						</Text>
					</Box>
				</Box>
			</ScrollView>
		</Screen>
	);
}
