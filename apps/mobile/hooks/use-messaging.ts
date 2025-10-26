import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as messaging from "@/api/messaging";
import { useAuthStore } from "@/stores/auth-store";

export function useListChatsQuery() {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["chats"],
		queryFn: messaging.listChats,
		enabled: !!tokens?.accessToken,
	});
}

export function useListMessagesQuery(
	chatId: string | undefined,
	limit = 50,
	offset = 0,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["messages", chatId, { limit, offset }],
		queryFn: () => messaging.listMessages(chatId!, limit, offset),
		enabled: !!tokens?.accessToken && !!chatId,
	});
}

export function useSendMessageMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			chatId,
			body,
		}: {
			chatId: string;
			body: Parameters<typeof messaging.sendMessage>[1];
		}) => messaging.sendMessage(chatId, body),
		onSuccess: (_, { chatId }) => {
			queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
		},
	});
}

export function useDeleteMessageMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: messaging.deleteMessage,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["messages"] });
		},
	});
}
