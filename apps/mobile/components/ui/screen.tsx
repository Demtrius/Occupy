import { StatusBar } from "expo-status-bar";
import type { ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "./restyle-components";

interface ScreenProps extends ViewProps {
	centerContent?: boolean;
	noTopPadding?: boolean;
}

export function Screen({
	children,
	centerContent = false,
	noTopPadding = false,
	...rest
}: ScreenProps) {
	const topPadding = noTopPadding || centerContent ? undefined : "xxl";

	return (
		<SafeAreaView
			style={[{ flex: 1 }, rest.style]}
			edges={["right", "left"]}
			{...rest}
		>
			<StatusBar style="auto" />
			<Box
				flex={1}
				backgroundColor="background"
				paddingTop={topPadding}
				justifyContent={centerContent ? "center" : undefined}
			>
				{children}
			</Box>
		</SafeAreaView>
	);
}
