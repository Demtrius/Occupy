import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { RequestOptions } from "openapi-fetch";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { components, operations } from "@/types/generated";

type Message = components["schemas"]["Message"];

type SendMessageVariables = RequestOptions<
	operations["MessagesCreateByChatId"]
>;
type DeleteMessageVariables = RequestOptions<operations["MessagesDeleteById"]>;

export function useListChatsQuery() {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["messages", "chats", tokens?.accessToken],
		enabled: Boolean(tokens?.accessToken),
		queryFn: async () => ensureData(await $api.GET("/api/v1/chats")),
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
	});
}

export function useListMessagesQuery(chatId: string | undefined, limit = 50) {
	const { tokens } = useAuthStore();
	return useInfiniteQuery({
		queryKey: [
			"messages",
			"chat",
			chatId ?? "",
			{ limit },
			tokens?.accessToken,
		],
		enabled: Boolean(tokens?.accessToken) && Boolean(chatId),
		initialPageParam: 0,
		queryFn: async ({ pageParam }) => {
			if (!chatId) {
				throw new Error("chatId is required");
			}
			return ensureData(
				await $api.GET("/api/v1/messages/{chatId}", {
					params: {
						path: { chatId },
						query: { limit, offset: pageParam },
					},
				}),
			);
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < limit) return undefined;
			return allPages.length * limit;
		},
		staleTime: 60 * 1000, // 1 minute for messages
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
	});
}

export function useSendMessageMutation() {
	const queryClient = useQueryClient();
	return useMutation<Message, unknown, SendMessageVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.POST("/api/v1/messages/{chatId}", variables)),
		onSuccess: (message, variables) => {
			const chatId = variables.params?.path?.chatId;
			if (chatId) {
				// Optimistically update the query data instead of invalidating
				queryClient.setQueryData(
					["messages", "chat", chatId, { limit: 50 }, undefined], // assuming default limit
					(oldData: any) => {
						if (!oldData) return oldData;
						const newPages = [...oldData.pages];
						newPages[0] = [message, ...newPages[0]]; // prepend to first page
						return { ...oldData, pages: newPages };
					},
				);
			}
		},
	});
}

export function useDeleteMessageMutation() {
	const queryClient = useQueryClient();
	return useMutation<
		Record<string, string>,
		unknown,
		DeleteMessageVariables,
		{ previousData: [any, any][] }
	>({
		mutationFn: async (variables) =>
			ensureData(await $api.DELETE("/api/v1/messages/{messageId}", variables)),
		onMutate: async (variables) => {
			const messageId = variables.params?.path?.messageId;
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: ["messages"],
				exact: false,
			});

			// Snapshot the previous value
			const previousData = queryClient.getQueriesData({
				queryKey: ["messages"],
				exact: false,
			});

			// Optimistically remove message from cache
			queryClient.setQueriesData(
				{
					queryKey: ["messages"],
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

			return { previousData };
		},
		onError: (err, variables, context) => {
			// Rollback on error
			if (context?.previousData) {
				context.previousData.forEach(([queryKey, data]: [any, any]) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
		},
	});
}

type MarkReadVariables = { body: { chat_id: string } };

export function useMarkMessagesReadMutation() {
	const queryClient = useQueryClient();
	return useMutation<
		{ marked_read: number },
		unknown,
		MarkReadVariables,
		{ previousData: any }
	>({
		mutationFn: async (variables) =>
			ensureData(await ($api as any).POST("/api/v1/messages/read", variables)),
		onMutate: async (variables) => {
			const chatId = variables.body.chat_id;
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: ["messages", "chat", chatId],
				exact: false,
			});

			// Snapshot the previous value
			const previousData = queryClient.getQueryData([
				"messages",
				"chat",
				chatId,
				{ limit: 50 },
				undefined,
			]);

			// Optimistically update read status
			queryClient.setQueryData(
				["messages", "chat", chatId, { limit: 50 }, undefined],
				(oldData: any) => {
					if (!oldData || !oldData.pages) return oldData;
					const now = new Date().toISOString();
					const newPages = oldData.pages.map((page: any[]) =>
						page.map((msg) => ({ ...msg, readAt: now })),
					);
					return { ...oldData, pages: newPages };
				},
			);

			return { previousData };
		},
		onError: (err, variables, context) => {
			// Rollback on error
			if (context?.previousData) {
				queryClient.setQueryData(
					[
						"messages",
						"chat",
						variables.body.chat_id,
						{ limit: 50 },
						undefined,
					],
					context.previousData,
				);
			}
		},
	});
}
