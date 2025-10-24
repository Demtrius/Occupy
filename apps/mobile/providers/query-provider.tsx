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
			retry: (failureCount, err: any) =>
				err?.status === 401 ? false : failureCount < 2,
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

export function QueryProvider({ children }: PropsWithChildren) {
	return (
		<QueryClientProvider client={client}>
			{children}
			{__DEV__ && Platform.OS === "web" ? (
				<ReactQueryDevtools buttonPosition="bottom-left" />
			) : null}
		</QueryClientProvider>
	);
}
