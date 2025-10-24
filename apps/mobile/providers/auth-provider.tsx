import type React from "react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/state/auth.store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const hydrate = useAuthStore((s) => s.hydrate);
	const [ready, setReady] = useState(false);
	useEffect(() => {
		hydrate().finally(() => setReady(true));
	}, [hydrate]);
	if (!ready) return null;
	return <>{children}</>;
}
