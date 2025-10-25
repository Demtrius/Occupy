import { ActivityIndicator } from "react-native";
import { Screen } from "@/components/screen";
import { Box } from "./restyle-components";

export function LoadingScreen() {
	return (
		<Screen>
			<Box flex={1} alignItems="center" justifyContent="center">
				<ActivityIndicator size="large" />
			</Box>
		</Screen>
	);
}
