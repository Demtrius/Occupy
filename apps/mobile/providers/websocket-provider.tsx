import { useMeQuery } from "@/hooks/use-users";
import { useWebSocket } from "@/hooks/use-websocket";

export function WebSocketProvider() {
	const { data: me } = useMeQuery();
	useWebSocket("user", me?.id);
	return null;
}
