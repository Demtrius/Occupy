import { useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useListChatsQuery() {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/chats", {
		enabled: !!tokens?.accessToken,
	});
}

export function useListMessagesQuery(
	chatId: string | undefined,
	limit = 50,
	offset = 0,
) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/messages/{chatId}", {
		params: {
			path: { chatId: chatId! },
			query: { limit, offset },
		},
		enabled: !!tokens?.accessToken && !!chatId,
	});
}

export function useSendMessageMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/messages/{chatId}", {
		onSuccess: (data, variables) => {
			const chatId = variables.params.path.chatId;
			queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
		},
	});
}

export function useDeleteMessageMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("delete", "/api/v1/messages/{messageId}", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["messages"] });
		},
	});
}
