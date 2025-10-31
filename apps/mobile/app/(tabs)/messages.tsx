import { useTheme } from "@shopify/restyle";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { ChatCard } from "@/components/cards/chat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Box } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { SearchInput } from "@/components/ui/search-input";
import type { Theme } from "@/config/theme";
import { useDebounce } from "@/hooks/use-debounce";
import { useListChatsQuery } from "@/hooks/use-messaging";
import { useMeQuery } from "@/hooks/use-users";
import { $api, ensureData } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function Page() {
	const theme = useTheme<Theme>();
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const { data: chats, isLoading } = useListChatsQuery();
	const { data: me } = useMeQuery();
	const { tokens } = useAuthStore();

	const lastMessagesQueries = useQueries({
		queries:
			chats?.map((chat) => ({
				queryKey: ["messages", "chat", chat.id, { limit: 1, offset: 0 }],
				queryFn: async () =>
					ensureData(
						await $api.GET("/api/v1/messages/{chatId}", {
							params: {
								path: { chatId: chat.id },
								query: { limit: 1, offset: 0 },
							},
						}),
					),
				enabled: Boolean(tokens?.accessToken),
			})) || [],
	});

	const lastMessages = lastMessagesQueries.map((q) => q.data?.[0]);

	const sortedChats = useMemo(() => {
		if (!chats) return [];
		return [...chats].sort((a, b) => {
			const aIndex = chats.indexOf(a);
			const bIndex = chats.indexOf(b);
			const aLast = lastMessages[aIndex];
			const bLast = lastMessages[bIndex];
			const aTime = aLast?.sentAt || a.createdAt;
			const bTime = bLast?.sentAt || b.createdAt;
			return new Date(bTime).getTime() - new Date(aTime).getTime();
		});
	}, [chats, lastMessages]);

	const lastMessageMap = useMemo(() => {
		const map = new Map();
		chats?.forEach((chat, index) => {
			map.set(chat.id, lastMessages[index]);
		});
		return map;
	}, [chats, lastMessages]);

	const handleClearSearch = () => {
		setSearchQuery("");
	};

	// Filter chats based on debounced search query (placeholder - would need more chat data)
	const filteredChats =
		sortedChats?.filter((chat) =>
			chat.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
		) || [];

	return (
		<Screen>
			<Box padding="s" paddingBottom="s">
				<SearchInput
					placeholder="Search conversations..."
					value={searchQuery}
					onChangeText={setSearchQuery}
					onClear={handleClearSearch}
				/>
			</Box>
			<ScrollView showsVerticalScrollIndicator={false}>
				<Box padding="s">
					{isLoading ? (
						<Box alignItems="center" padding="xl">
							<ActivityIndicator color={theme.colors.primary} />
						</Box>
					) : filteredChats.length > 0 ? (
						filteredChats.map((chat) => (
							<ChatCard
								key={chat.id}
								chat={chat}
								me={me}
								lastMessage={lastMessageMap.get(chat.id)}
							/>
						))
					) : (
						<EmptyState
							message={
								debouncedSearchQuery
									? "No conversations found"
									: "No conversations yet"
							}
						/>
					)}
				</Box>
			</ScrollView>
		</Screen>
	);
}
