import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";

import { ToastHost } from "@/components/toast-host";
import Providers from "@/providers";
import { useAuthStore } from "@/stores/auth-store";

export default function RootLayout() {
	const [hydrated, setHydrated] = useState(false);
	const { hydrate, tokens, user } = useAuthStore();
	const router = useRouter();
	const segments = useSegments();

	useEffect(() => {
		hydrate().then(() => setHydrated(true));
	}, [hydrate]);

	useEffect(() => {
		if (!hydrated) return;

		const inAuthGroup = segments[0] === "(auth)";

		if ((!tokens?.accessToken || !user) && !inAuthGroup) {
			// Redirect to login if not authenticated and not already in auth group
			router.replace("/(auth)/login");
		} else if (tokens?.accessToken && user && inAuthGroup) {
			// Redirect to main app if authenticated but in auth group
			router.replace("/(tabs)/feed");
		}
	}, [hydrated, tokens, user, segments, router]);

	if (!hydrated) {
		return null; // or a loading screen
	}

	return (
		<Providers>
			<Stack
				screenOptions={{
					headerShown: false,
					gestureEnabled: true,
					fullScreenGestureEnabled: true,
				}}
			>
				<Stack.Screen name="(tabs)" options={{ animation: "none" }} />
			</Stack>
			<ToastHost />
		</Providers>
	);
}
