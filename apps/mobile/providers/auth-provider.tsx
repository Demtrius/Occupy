import { type PropsWithChildren, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function AuthProvider({ children }: PropsWithChildren) {
	const hydrate = useAuthStore((s) => s.hydrate);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		hydrate().finally(() => setReady(true));
	}, [hydrate]);

	if (!ready) return null;

	return <>{children}</>;
}
