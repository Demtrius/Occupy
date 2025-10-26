import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { TouchableOpacity } from "react-native";
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

	return (
		<Box
			position="relative"
			style={{
				minHeight: 44,
				borderRadius: theme.borderRadii.m,
				paddingBlock: theme.spacing.s,
				paddingInline: theme.spacing.m,
				backgroundColor: theme.colors.card,
				borderWidth: 1,
				borderColor: theme.colors.border,
				shadowColor: theme.colors.ring,
				shadowOffset: {
					width: 0,
					height: 2,
				},
				shadowOpacity: 0.12,
				shadowRadius: 4,
				elevation: 2,
				paddingRight: 40,
			}}
		>
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
					color: theme.colors.foreground,
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
