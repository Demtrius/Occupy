// label.tsx

import type React from "react";
import { Text } from "./restyle-components";

export function Label({ children }: { children: React.ReactNode }) {
	return <Text variant="label">{children}</Text>;
}
