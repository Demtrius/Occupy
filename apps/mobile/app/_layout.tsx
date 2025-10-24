import { Slot } from "expo-router";
import { useEffect, useState } from "react";

import { ToastHost } from "@/components/toast-host";
import Providers from "@/providers";
import { useAuthStore } from "@/stores/auth-store";

export default function RootLayout() {
	const [hydrated, setHydrated] = useState(false);
	const { hydrate } = useAuthStore();

	useEffect(() => {
		hydrate().then(() => setHydrated(true));
	}, [hydrate]);

	if (!hydrated) {
		return null; // or a loading screen
	}

	return (
		<Providers>
			<Slot />
			<ToastHost />
		</Providers>
	);
}
