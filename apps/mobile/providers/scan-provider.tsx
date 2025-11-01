import { type PropsWithChildren, useEffect } from "react";
import { Platform } from "react-native";

export default function ScanProvider({ children }: PropsWithChildren) {
	useEffect(() => {
		if (__DEV__ && Platform.OS === "web") {
			import("react-scan")
				.then(({ scan }) => {
					scan({
						enabled: __DEV__,
						showToolbar: true,
						animationSpeed: "fast",
						trackUnnecessaryRenders: true,
					});
				})
				.catch((err) => {
					console.warn("react-scan failed to load:", err);
				});
		}
	}, []);

	return <>{children}</>;
}
