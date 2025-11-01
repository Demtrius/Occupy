import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/config/env";
import { useAuthStore } from "@/stores/auth-store";

type WebSocketType = "chat" | "user";

interface UseWebSocketOptions {
	onMessage?: (data: any) => void;
	onError?: (error: Event) => void;
	onClose?: () => void;
	onOpen?: () => void;
}

// Track active connections to prevent duplicates
const activeConnections = new Set<string>();

export function useWebSocket(
	type: WebSocketType,
	id: string | undefined,
	options: UseWebSocketOptions = {},
) {
	const { onMessage, onError, onClose, onOpen } = options;
	const { tokens } = useAuthStore();
	const queryClient = useQueryClient();
	const wsRef = useRef<WebSocket | null>(null);
	const callbacksRef = useRef({ onMessage, onError, onClose, onOpen });
	const connectionKeyRef = useRef<string | null>(null);

	// Helper function to invalidate chat list queries (mirrors useSendMessageMutation)
	const invalidateChatListQueries = useCallback(() => {
		// Invalidate chat list to refresh chats order
		queryClient.invalidateQueries({
			queryKey: ["messages", "chats", tokens?.accessToken],
		});

		// Invalidate last message queries for all chats to refresh chat list
		queryClient.invalidateQueries({
			queryKey: ["messages", "chat"],
			exact: false,
			predicate: (query) => {
				// Only invalidate queries that fetch last messages (limit: 1, offset: 0)
				const queryKey = query.queryKey;
				return (
					Array.isArray(queryKey) &&
					queryKey[0] === "messages" &&
					queryKey[1] === "chat" &&
					queryKey[3]?.limit === 1 &&
					queryKey[3]?.offset === 0 &&
					queryKey[4] === tokens?.accessToken
				);
			},
		});
	}, [queryClient, tokens?.accessToken]);

	// Update callbacks ref without causing reconnection
	useEffect(() => {
		callbacksRef.current = { onMessage, onError, onClose, onOpen };
	}, [onMessage, onError, onClose, onOpen]);

	useEffect(() => {
		if (!id || !tokens?.accessToken) return;

		const connectionKey = `${type}_${id}`;
		connectionKeyRef.current = connectionKey;

		// Check if we already have an active connection for this room
		if (activeConnections.has(connectionKey)) {
			console.log(
				`[WebSocket] Connection already exists for ${connectionKey}, skipping`,
			);
			return;
		}

		// Close existing connection if any
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		const wsUrl = `${API_BASE_URL.replace(/^http/, "ws")}/ws/${type}/${id}?token=${tokens.accessToken}`;
		const connectionId = `${connectionKey}_${Date.now()}`;
		activeConnections.add(connectionKey);
		const ws = new WebSocket(wsUrl);
		wsRef.current = ws;
		(ws as any).connectionId = connectionId;

		ws.onopen = () => {
			callbacksRef.current.onOpen?.();
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log(`[WebSocket] ${type} message:`, data.type, data);
				if (type === "chat") {
					if (data.type === "message.created") {
						// Extract message and chat_id from nested structure
						const message = data.message;
						const chatId = message?.chat_id;

						if (!chatId) {
							console.error(
								"[WebSocket] No chat_id in message.created event:",
								data,
							);
							return;
						}

						console.log(`[WebSocket] Updating chat ${chatId} with new message`);

						// Transform snake_case WebSocket fields to camelCase to match API schema
						const transformedMessage = {
							body: message.body,
							id: message.id,
							chatId: message.chat_id,
							senderUserId: message.sender_user_id, // Fix: snake_case to camelCase
							sentAt: message.sent_at, // Fix: snake_case to camelCase
							readAt: message.read_at,
							mediaId: message.media_id, // Fix: snake_case to camelCase
						};

						// Update all possible query keys for this chat
						queryClient.setQueriesData(
							{
								queryKey: ["messages", "chat", chatId],
								exact: false,
							},
							(oldData: any) => {
								console.log(
									`[WebSocket] Updating query data:`,
									oldData ? "found" : "not found",
								);
								if (!oldData || !oldData.pages) return oldData;
								const newPages = [...oldData.pages];
								// Add new message to the beginning of first page
								newPages[0] = [transformedMessage, ...newPages[0]];
								return { ...oldData, pages: newPages };
							},
						);

						// Invalidate chat list queries to refresh last messages display
						invalidateChatListQueries();
					} else if (data.type === "message.deleted") {
						// Extract message info from nested structure
						const message = data.message;
						const chatId = message?.chat_id;
						const messageId = message?.id;

						if (!chatId || !messageId) {
							console.error(
								"[WebSocket] Missing chat_id or id in message.deleted event:",
								data,
							);
							return;
						}

						// Direct cache update for deleted message with correct structure
						queryClient.setQueriesData(
							{
								queryKey: ["messages", "chat", chatId],
								exact: false,
							},
							(oldData: any) => {
								if (!oldData || !oldData.pages) return oldData;
								const newPages = oldData.pages.map((page: any[]) =>
									page.filter((msg) => msg.id !== messageId),
								);
								return { ...oldData, pages: newPages };
							},
						);

						// Invalidate chat list queries to refresh after message deletion
						invalidateChatListQueries();
					} else if (data.type === "messages.read") {
						// messages.read events indicate a user has read messages
						// We need to update read status for all messages in all chats
						// where this user is the recipient
						console.log("WebSocket messages.read event:", data);

						// Update all message queries to mark messages as read
						queryClient.setQueriesData(
							{
								queryKey: ["messages", "chat"],
								exact: false,
							},
							(oldData: any) => {
								if (!oldData || !oldData.pages) return oldData;

								const newPages = oldData.pages.map((page: any[]) =>
									page.map((msg) => {
										// Mark as read if:
										// 1. Message was sent by current user (they're reading someone else's message)
										// 2. Or message was sent to current user (someone read their message)
										// For now, we'll mark all messages in chat as read
										// This is a simplification - in reality we'd track which specific messages were read
										const isFromCurrentUser = msg.senderUserId === data.user_id;
										const isToCurrentUser = msg.senderUserId !== data.user_id;

										// If this read event is for messages sent by others to current user,
										// or if current user is reading messages sent by others, mark as read
										if (isToCurrentUser || !isFromCurrentUser) {
											return { ...msg, readAt: new Date().toISOString() };
										}
										return msg;
									}),
								);
								return { ...oldData, pages: newPages };
							},
						);

						// Invalidate chat list queries to refresh read status indicators
						invalidateChatListQueries();
					}
					// typing events are handled in component
				} else if (type === "user") {
					if (data.type === "chat.updated") {
						// Update specific chat in cache with correct structure
						queryClient.setQueriesData(
							{
								queryKey: ["messages", "chats"],
								exact: false,
							},
							(oldData: any) => {
								if (!oldData) return oldData;
								return oldData.map((chat: any) =>
									chat.id === data.chat_id ? { ...chat, ...data } : chat,
								);
							},
						);

						// Invalidate chat list queries to refresh after chat update
						invalidateChatListQueries();
					}
				}
				callbacksRef.current.onMessage?.(data);
			} catch (error) {
				console.error("WebSocket message parse error:", error);
			}
		};

		ws.onerror = (error) => {
			console.error(`${type} WebSocket error:`, error);
			callbacksRef.current.onError?.(error);
		};

		ws.onclose = () => {
			wsRef.current = null;
			// Remove from active connections
			if (connectionKeyRef.current) {
				activeConnections.delete(connectionKeyRef.current);
			}
			callbacksRef.current.onClose?.();
		};

		return () => {
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
			// Remove from active connections on cleanup
			if (connectionKeyRef.current) {
				activeConnections.delete(connectionKeyRef.current);
			}
		};
	}, [id, tokens?.accessToken, type, queryClient, invalidateChatListQueries]);

	return {
		ws: wsRef.current,
		send: (data: any) => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				try {
					wsRef.current.send(JSON.stringify(data));
				} catch (error) {
					console.error(`[WebSocket] Send failed:`, error);
				}
			}
		},
	};
}
