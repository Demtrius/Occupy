import { useCallback, useEffect, useRef, useState } from "react";
import type { operations } from "@/types/generated";
import { useSendMessageMutation } from "./use-messaging";
import { useWebSocket } from "./use-websocket";

interface QueuedMessage {
	id: string;
	chatId: string;
	body: string;
	mediaId?: string;
	timestamp: number;
	retryCount: number;
	maxRetries?: number;
	lastRetryTime?: number;
}

export function useOfflineQueue(chatId: string | undefined) {
	const sendMutation = useSendMessageMutation();
	const [isOnline, setIsOnline] = useState(true);
	const [queue, setQueue] = useState<QueuedMessage[]>([]);
	const queueRef = useRef<QueuedMessage[]>([]);
	const processingRef = useRef(false);
	const reconnectTimeoutRef = useRef<number | null>(null);

	// Update queue ref when state changes
	useEffect(() => {
		queueRef.current = queue;
	}, [queue]);

	// Monitor WebSocket connection status
	const { ws } = useWebSocket("user", undefined);

	useEffect(() => {
		if (!ws) return;

		const handleOnline = () => {
			console.log("[OfflineQueue] Connection restored");
			setIsOnline(true);
			processQueue();
		};

		const handleOffline = () => {
			console.log("[OfflineQueue] Connection lost");
			setIsOnline(false);
			
			// Clear any existing reconnect timeout
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
				reconnectTimeoutRef.current = null;
			}
		};

		ws.addEventListener("open", handleOnline);
		ws.addEventListener("close", handleOffline);

		return () => {
			ws.removeEventListener("open", handleOnline);
			ws.removeEventListener("close", handleOffline);
		};
	}, [ws]);

	// Process queued messages when coming back online
	const processQueue = useCallback(async () => {
		if (processingRef.current || queueRef.current.length === 0) {
			return;
		}

		processingRef.current = true;
		console.log(
			`[OfflineQueue] Processing ${queueRef.current.length} queued messages`,
		);

		const messagesToSend = [...queueRef.current];
		setQueue([]);

		for (const queuedMessage of messagesToSend) {
			try {
				// Add exponential backoff delay for retries
				if (queuedMessage.retryCount > 0) {
					const delay = Math.min(1000 * Math.pow(2, queuedMessage.retryCount), 10000);
					await new Promise(resolve => setTimeout(resolve, delay));
				}
				
				await sendMutation.mutateAsync({
					params: { path: { chatId: queuedMessage.chatId } },
					body: {
						body: queuedMessage.body,
						mediaId: queuedMessage.mediaId,
					},
				});
				console.log(`[OfflineQueue] Sent queued message ${queuedMessage.id}`);
			} catch (error) {
				console.error(
					`[OfflineQueue] Failed to send queued message ${queuedMessage.id}:`,
					error,
				);
				
				const maxRetries = queuedMessage.maxRetries || 3;
				// Re-queue with increased retry count if under max retries
				if (queuedMessage.retryCount < maxRetries) {
					const retryDelay = Math.min(1000 * Math.pow(2, queuedMessage.retryCount), 10000);
					setQueue((prev) => [
						...prev,
						{
							...queuedMessage,
							retryCount: queuedMessage.retryCount + 1,
							timestamp: Date.now() + retryDelay,
							lastRetryTime: Date.now(),
						},
					]);
				} else {
					console.warn(`[OfflineQueue] Max retries exceeded for message ${queuedMessage.id}, dropping message`);
				}
			}
		}

		processingRef.current = false;
	}, [sendMutation]);

	// Add message to queue if offline
	const queueMessage = useCallback(
		(body: string, mediaId?: string) => {
			if (!chatId) return;

			const queuedMessage: QueuedMessage = {
				id: `queued-${Date.now()}-${Math.random()}`,
				chatId,
				body,
				mediaId,
				timestamp: Date.now(),
				retryCount: 0,
			};

			if (isOnline) {
				// Try to send immediately if online
				sendMutation.mutate({
					params: { path: { chatId } },
					body: { body, mediaId },
				});
			} else {
				// Add to queue if offline
				console.log(`[OfflineQueue] Queuing message ${queuedMessage.id}`);
				setQueue((prev) => [...prev, queuedMessage]);
			}
		},
		[chatId, isOnline, sendMutation],
	);

	// Clear queue and timeouts on component unmount
	useEffect(() => {
		return () => {
			console.log("[OfflineQueue] Cleaning up queue");
			setQueue([]);
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
				reconnectTimeoutRef.current = null;
			}
		};
	}, []);

	return {
		queueMessage,
		queue,
		isOnline,
		queuedCount: queue.length,
	};
}
