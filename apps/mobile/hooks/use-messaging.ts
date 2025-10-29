import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RequestOptions } from "openapi-fetch";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { components, operations } from "@/types/generated";

type Message = components["schemas"]["Message"];

type SendMessageVariables = RequestOptions<
	operations["MessagesCreateByChatId"]
>;
type DeleteMessageVariables = RequestOptions<operations["MessagesDeleteById"]>;

const messageKeys = {
	chats: ["messages", "chats"] as const,
	chat: (chatId: string, limit: number, offset: number) =>
		["messages", "chat", chatId, { limit, offset }] as const,
};

export function useListChatsQuery() {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: messageKeys.chats,
		enabled: Boolean(tokens?.accessToken),
		queryFn: async () => ensureData(await $api.GET("/api/v1/chats")),
	});
}

export function useListMessagesQuery(
	chatId: string | undefined,
	limit = 50,
	offset = 0,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: messageKeys.chat(chatId ?? "", limit, offset),
		enabled: Boolean(tokens?.accessToken) && Boolean(chatId),
		queryFn: async () => {
			if (!chatId) {
				throw new Error("chatId is required");
			}
			return ensureData(
				await $api.GET("/api/v1/messages/{chatId}", {
					params: {
						path: { chatId },
						query: { limit, offset },
					},
				}),
			);
		},
	});
}

export function useSendMessageMutation() {
	const queryClient = useQueryClient();
	return useMutation<Message, unknown, SendMessageVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.POST("/api/v1/messages/{chatId}", variables)),
		onSuccess: (_message, variables) => {
			const chatId = variables.params?.path?.chatId;
			if (chatId) {
				queryClient.invalidateQueries({
					queryKey: ["messages", "chat", chatId],
					exact: false,
				});
			}
		},
	});
}

export function useDeleteMessageMutation() {
	const queryClient = useQueryClient();
	return useMutation<Record<string, string>, unknown, DeleteMessageVariables>({
		mutationFn: async (variables) =>
			ensureData(await $api.DELETE("/api/v1/messages/{messageId}", variables)),
		onSuccess: (_data, variables) => {
			const messageId = variables.params?.path?.messageId;
			if (messageId) {
				queryClient.invalidateQueries({
					queryKey: ["messages"],
					exact: false,
				});
			}
		},
	});
}
