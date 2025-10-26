import { api } from "@/lib/api-client";
import type { Notification } from "@/types/notifications";

export async function listNotifications(
	limit = 50,
	offset = 0,
): Promise<Notification[]> {
	const response = await api.get("/api/v1/notifications", {
		params: { limit, offset },
	});
	return response.data as Notification[];
}

export async function markNotificationRead(
	notificationId: string,
): Promise<Notification> {
	const response = await api.put(
		`/api/v1/notifications/${notificationId}/read`,
	);
	return response.data as Notification;
}

export async function markAllRead(): Promise<{ message: string }> {
	const response = await api.put("/api/v1/notifications/read-all");
	return response.data as { message: string };
}
