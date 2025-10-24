// form-description.tsx

import type React from "react";
import { Text } from "./restyle-components";

export function FormDescription({ children }: { children?: React.ReactNode }) {
	if (!children) return null;
	return <Text variant="caption">{children}</Text>;
}
