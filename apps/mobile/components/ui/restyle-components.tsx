import { createBox, createText, useTheme } from "@shopify/restyle";
import type React from "react";
import { Pressable, TextInput } from "react-native";
import type { Theme } from "@/config/theme";

export const Box = createBox<Theme>();
export const Text = createText<Theme>();

export const Button: React.FC<
	React.ComponentProps<typeof Pressable> & {
		children?: React.ReactNode;
		variant?: keyof Theme["buttonVariants"];
	}
> = ({ children, variant = "defaults", disabled, ...rest }) => {
	const theme = useTheme<Theme>();
	const buttonStyle = theme.buttonVariants[variant];

	return (
		<Pressable
			style={
				{
					...buttonStyle,
					opacity: disabled ? 0.5 : (buttonStyle as any).opacity || 1,
				} as any
			}
			accessibilityRole="button"
			hitSlop={10}
			disabled={disabled}
			{...rest}
		>
			{children}
		</Pressable>
	);
};

export const Input: React.FC<
	React.ComponentProps<typeof TextInput> & {
		variant?: keyof Theme["inputVariants"];
	}
> = ({ variant = "defaults", ...rest }) => {
	const theme = useTheme<Theme>();
	const inputStyle = theme.inputVariants[variant];

	return <TextInput style={inputStyle as any} {...rest} />;
};

export const Card: React.FC<
	React.ComponentProps<typeof Box> & { variant?: keyof Theme["cardVariants"] }
> = ({ variant = "defaults", ...rest }) => {
	const theme = useTheme<Theme>();
	const cardStyle = theme.cardVariants[variant];

	return <Box style={cardStyle as any} {...rest} />;
};
