import type React from "react";
import { Button as RestyleButton, Text } from "./restyle-components";

interface ButtonProps
	extends Omit<React.ComponentProps<typeof RestyleButton>, "children"> {
	children: React.ReactNode;
	textProps?: React.ComponentProps<typeof Text>;
}

export function Button({
	children,
	disabled,
	variant = "primary",
	textProps,
	...rest
}: ButtonProps) {
	return (
		<RestyleButton disabled={disabled} variant={variant} {...rest}>
			<Text fontWeight="500" {...textProps}>
				{children}
			</Text>
		</RestyleButton>
	);
}
