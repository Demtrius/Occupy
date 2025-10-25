import { useEffect } from "react";
import { useTheme } from "@shopify/restyle";
import { TouchableOpacity } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import type { Theme } from "@/config/theme";
import { Box } from "./restyle-components";

interface SwitchProps {
	value: boolean;
	onValueChange: (value: boolean) => void;
	disabled?: boolean;
}

export function Switch({ value, onValueChange, disabled }: SwitchProps) {
	const theme = useTheme<Theme>();
	const translateX = useSharedValue(0);

	useEffect(() => {
		translateX.value = withTiming(value ? 18 : 0, { duration: 200 });
	}, [value]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const handlePress = () => {
		if (disabled) return;
		const newValue = !value;
		onValueChange(newValue);
		translateX.value = withTiming(newValue ? 18 : 0, { duration: 200 });
	};

	return (
		<TouchableOpacity onPress={handlePress} disabled={disabled}>
			<Box
				width={44}
				height={24}
				borderRadius="xl"
				backgroundColor={value ? "primary" : "muted"}
				justifyContent="center"
				paddingHorizontal="xs"
			>
				<Animated.View
					style={[
						{
							width: 20,
							height: 20,
							borderRadius: 10,
							backgroundColor: theme.colors["primary-foreground"],
						},
						animatedStyle,
					]}
				/>
			</Box>
		</TouchableOpacity>
	);
}
