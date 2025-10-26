import { StatusBar } from "expo-status-bar";
import type { ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "./restyle-components";

export function Screen({ children, ...rest }: ViewProps) {
	return (
		<SafeAreaView
			style={[{ flex: 1 }, rest.style]}
			edges={["right", "left"]}
			{...rest}
		>
			<StatusBar style="auto" />
			<Box flex={1} backgroundColor="background" paddingTop="xxl">
				{children}
			</Box>
		</SafeAreaView>
	);
}
