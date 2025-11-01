import { useTheme } from "@shopify/restyle";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const { data: chats, isLoading } = useListChatsQuery();
	const { data: me } = useMeQuery();
	const { tokens } = useAuthStore();

	// Refresh chat list when tab becomes focused
	useFocusEffect(
		useCallback(() => {
			// Invalidate chat list to ensure it's fresh when user returns
			queryClient.invalidateQueries({
				queryKey: ["messages", "chats", tokens?.accessToken],
			});

			// Invalidate last message queries to refresh chat list
			queryClient.invalidateQueries({
				queryKey: ["messages", "chat"],
				exact: false,
				predicate: (query) => {
					// Only invalidate queries that fetch last messages (limit: 1, offset: 0)
					const queryKey = query.queryKey;
					return (
						Array.isArray(queryKey) &&
						queryKey[0] === "messages" &&
						queryKey[1] === "chat" &&
						queryKey[3]?.limit === 1 &&
						queryKey[3]?.offset === 0 &&
						queryKey[4] === tokens?.accessToken
					);
				},
			});
		}, [queryClient, tokens?.accessToken]),
	);

	const lastMessagesQueries = useQueries({
		queries:
			chats?.map((chat) => ({
				queryKey: [
					"messages",
					"chat",
					chat.id,
					{ limit: 1, offset: 0 },
					tokens?.accessToken,
				],
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
				staleTime: 30 * 1000, // 30 seconds
				gcTime: 5 * 60 * 1000, // 5 minutes
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
