import type { PropsWithChildren } from "react";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: PropsWithChildren) {
	return (
		<ThemeProvider>
			<QueryProvider>{children}</QueryProvider>
		</ThemeProvider>
	);
}
