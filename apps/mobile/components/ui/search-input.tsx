import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { type StyleProp, TouchableOpacity, type ViewStyle } from "react-native";
import type { Theme } from "@/config/theme";
import { Box, Input as RestyleInput } from "./restyle-components";

export function SearchInput({
	editable = true,
	onClear,
	...props
}: React.ComponentProps<typeof RestyleInput> & {
	onClear?: () => void;
}) {
	const theme = useTheme<Theme>();
	const inputStyle = theme.inputVariants.defaults;

	const resolvedStyle: StyleProp<ViewStyle> = {
		...inputStyle,
		paddingRight: 40,
	};

	return (
		<Box position="relative" style={resolvedStyle}>
			<RestyleInput
				editable={editable}
				placeholderTextColor={theme.colors["muted-foreground"]}
				style={{
					borderWidth: 0,
					backgroundColor: "transparent",
					paddingHorizontal: 0,
					paddingVertical: 0,
					minHeight: "auto",
					height: 22,
				}}
				{...props}
			/>
			{props.value && (
				<Box
					position="absolute"
					right={0}
					top={0}
					bottom={0}
					justifyContent="center"
					alignItems="center"
					paddingRight="m"
				>
					<TouchableOpacity onPress={onClear}>
						<Ionicons
							name="close-circle"
							size={20}
							color={theme.colors["muted-foreground"]}
							style={{ opacity: 0.7 }}
						/>
					</TouchableOpacity>
				</Box>
			)}
		</Box>
	);
}
