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
		backgroundColor?: keyof Theme["colors"];
	}
> = ({
	children,
	variant = "defaults",
	disabled,
	backgroundColor: bgColor,
	...rest
}) => {
	const theme = useTheme<Theme>();
	const baseStyle = theme.buttonVariants.defaults;
	const variantStyle = theme.buttonVariants[variant];
	const buttonStyle = { ...baseStyle, ...variantStyle };

	const resolvedBackgroundColor =
		typeof buttonStyle.backgroundColor === "string" &&
		buttonStyle.backgroundColor in theme.colors
			? theme.colors[buttonStyle.backgroundColor as keyof typeof theme.colors]
			: buttonStyle.backgroundColor;

	const finalBackgroundColor = bgColor
		? theme.colors[bgColor]
		: resolvedBackgroundColor;

	const resolvedStyle = {
		...buttonStyle,
		backgroundColor: finalBackgroundColor,
	};

	return (
		<Pressable
			style={
				{
					...resolvedStyle,
					opacity: disabled ? 0.5 : (resolvedStyle as any).opacity || 1,
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
		backgroundColor?: keyof Theme["colors"];
	}
> = ({ variant = "defaults", backgroundColor: bgColor, ...rest }) => {
	const theme = useTheme<Theme>();
	const inputStyle = theme.inputVariants[variant];

	const finalBackgroundColor = bgColor
		? theme.colors[bgColor]
		: inputStyle.backgroundColor;

	const resolvedStyle = {
		...inputStyle,
		backgroundColor: finalBackgroundColor,
	};

	return <TextInput style={resolvedStyle as any} {...rest} />;
};

export const Card: React.FC<
	React.ComponentProps<typeof Box> & { variant?: keyof Theme["cardVariants"] }
> = ({ variant = "defaults", ...rest }) => {
	const theme = useTheme<Theme>();
	const cardStyle = theme.cardVariants[variant];

	return <Box style={cardStyle as any} {...rest} />;
};
