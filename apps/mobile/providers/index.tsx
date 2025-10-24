import type { PropsWithChildren } from "react";
import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: PropsWithChildren) {
	return (
		<ThemeProvider>
			<QueryProvider>
				<AuthProvider>{children}</AuthProvider>
			</QueryProvider>
		</ThemeProvider>
	);
}
