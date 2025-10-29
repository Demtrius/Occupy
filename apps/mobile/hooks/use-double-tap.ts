import { useCallback, useRef } from "react";

/**
 * Returns a handler that invokes the provided callback when called twice
 * within the given threshold (in milliseconds).
 */
export function useDoubleTap(
	callback: () => void,
	threshold = 350,
): () => void {
	const lastTapRef = useRef(0);

	return useCallback(() => {
		const now = Date.now();
		if (now - lastTapRef.current <= threshold) {
			lastTapRef.current = 0;
			callback();
		} else {
			lastTapRef.current = now;
		}
	}, [callback, threshold]);
}
