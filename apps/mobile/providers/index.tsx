import type { PropsWithChildren } from "react";
import QueryProvider from "./query-provider";
import ScanProvider from "./scan-provider";
import ThemeProvider from "./theme-provider";
import WebSocketProvider from "./websocket-provider";

export default function Providers({ children }: PropsWithChildren) {
	return (
		<ThemeProvider>
			<QueryProvider>
				<WebSocketProvider />
				{children}
				<ScanProvider />
			</QueryProvider>
		</ThemeProvider>
	);
}
