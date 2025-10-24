import { useTheme } from "@shopify/restyle";
import type { Theme } from "@/config/theme";
import { Input as RestyleInput } from "./restyle-components";

export function Input({
	editable = true,
	...props
}: React.ComponentProps<typeof RestyleInput>) {
	const theme = useTheme<Theme>();

	return (
		<RestyleInput
			editable={editable}
			placeholderTextColor={theme.colors["muted-foreground"]}
			{...props}
		/>
	);
}
