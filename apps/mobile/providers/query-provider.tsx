import NetInfo from "@react-native-community/netinfo";
import {
	focusManager,
	onlineManager,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { PropsWithChildren } from "react";
import { AppState, Platform } from "react-native";

const client = new QueryClient({
	defaultOptions: {
		queries: {
			retry: (failureCount, error: unknown) => {
				const status =
					typeof error === "object" && error !== null && "status" in error
						? (error as { status?: unknown }).status
						: undefined;
				if (typeof status === "number" && status === 401) {
					return false;
				}
				return failureCount < 2;
			},
			staleTime: 30_000,
			gcTime: 300_000,
		},
	},
});

onlineManager.setEventListener((setOnline) =>
	NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
);
focusManager.setEventListener((handleFocus) => {
	const sub = AppState.addEventListener("change", (status) =>
		handleFocus(status === "active"),
	);
	return () => sub.remove();
});

export default function QueryProvider({ children }: PropsWithChildren) {
	return (
		<QueryClientProvider client={client}>
			{children}
			{__DEV__ && Platform.OS === "web" ? (
				<ReactQueryDevtools buttonPosition="bottom-left" />
			) : null}
		</QueryClientProvider>
	);
}
