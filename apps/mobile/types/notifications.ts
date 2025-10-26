export type Notification = {
	type: NotificationType;
	payload: Record<string, any>;
	isRead: boolean;
	readAt?: string | null;
	id: string;
	userId: string;
	createdAt: string;
};

export type NotificationType =
	| "like"
	| "comment"
	| "follow"
	| "booking_request"
	| "booking_confirmed"
	| "booking_cancelled"
	| "review"
	| "system"
	| "message";
