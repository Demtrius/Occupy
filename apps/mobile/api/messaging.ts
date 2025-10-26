import { api } from "@/lib/api-client";
import type { Chat, Message, MessageCreate } from "@/types/messaging";

export async function listChats(): Promise<Chat[]> {
	const response = await api.get("/api/v1/chats");
	return response.data as Chat[];
}

export async function listMessages(
	chatId: string,
	limit = 50,
	offset = 0,
): Promise<Message[]> {
	const response = await api.get(`/api/v1/messages/${chatId}`, {
		params: { limit, offset },
	});
	return response.data as Message[];
}

export async function sendMessage(
	chatId: string,
	body: MessageCreate,
): Promise<Message> {
	const response = await api.post(`/api/v1/messages/${chatId}`, body);
	return response.data as Message;
}

export async function deleteMessage(
	messageId: string,
): Promise<{ message: string }> {
	const response = await api.delete(`/api/v1/messages/${messageId}`);
	return response.data as { message: string };
}
