import type React from "react";
import { Button as RestyleButton, Text } from "./restyle-components";

export function Button({
	children,
	disabled,
	variant = "primary",
	...rest
}: React.ComponentProps<typeof RestyleButton> & React.PropsWithChildren) {
	return (
		<RestyleButton disabled={disabled} variant={variant} {...rest}>
			<Text variant="body" color="primary-foreground" fontWeight="500">
				{children}
			</Text>
		</RestyleButton>
	);
}
