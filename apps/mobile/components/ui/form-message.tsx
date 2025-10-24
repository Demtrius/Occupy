// form-message.tsx

import type React from "react";
import { Text } from "./restyle-components";

export function FormMessage({ children }: { children?: React.ReactNode }) {
	if (!children) return null;
	return <Text variant="error">{children}</Text>;
}
