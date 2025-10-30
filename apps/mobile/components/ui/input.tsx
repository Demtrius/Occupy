import { useTheme } from "@shopify/restyle";
import { type ComponentProps, forwardRef } from "react";
import type { TextInput } from "react-native";
import type { Theme } from "@/config/theme";
import { Input as RestyleInput } from "./restyle-components";

export const Input = forwardRef<TextInput, ComponentProps<typeof RestyleInput>>(
	function InputBase({ editable = true, ...props }, ref) {
		const theme = useTheme<Theme>();

		return (
			<RestyleInput
				ref={ref}
				editable={editable}
				placeholderTextColor={theme.colors["muted-foreground"]}
				{...props}
			/>
		);
	},
);
