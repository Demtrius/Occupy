export type Message = {
	body?: string | null;
	mediaId?: string | null;
	id: string;
	chatId: string;
	senderUserId: string;
	sentAt: string;
};

export type MessageCreate = {
	body?: string | null;
	mediaId?: string | null;
};

export type Chat = {
	businessUserId: string;
	clientUserId: string;
	id: string;
	createdAt: string;
};
