import type React from "react";
import { Button as RestyleButton, Text } from "./restyle-components";

export function Button({
	children,
	disabled,
	...rest
}: React.ComponentProps<typeof RestyleButton>) {
	return (
		<RestyleButton disabled={disabled} {...rest}>
			<Text variant="body" color="primary-foreground" fontWeight="500">
				{children}
			</Text>
		</RestyleButton>
	);
}
