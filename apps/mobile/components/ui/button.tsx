import type React from "react";
import { Button as RestyleButton, Text } from "./restyle-components";

export function Button({
	children,
	disabled,
	variant = "defaults",
	...rest
}: React.ComponentProps<typeof RestyleButton>) {
	return (
		<RestyleButton disabled={disabled} variant={variant} {...rest}>
			<Text variant="body" color="primary-foreground" fontWeight="500">
				{children}
			</Text>
		</RestyleButton>
	);
}
