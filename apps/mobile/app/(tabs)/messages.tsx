import { useTheme } from "@shopify/restyle";
import { useState } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Text } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { SearchInput } from "@/components/ui/search-input";
import type { Theme } from "@/config/theme";
import { useDebounce } from "@/hooks/use-debounce";
import { useListChatsQuery } from "@/hooks/use-messaging";

export default function Page() {
	const theme = useTheme<Theme>();
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const { data: chats, isLoading } = useListChatsQuery();

	const handleClearSearch = () => {
		setSearchQuery("");
	};

	// Filter chats based on debounced search query (placeholder - would need more chat data)
	const filteredChats =
		chats?.filter((chat) =>
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
							<Box
								key={chat.id}
								backgroundColor="card"
								borderRadius="m"
								padding="m"
								marginBottom="s"
								borderWidth={1}
								borderColor="border"
							>
								<Text variant="body" fontWeight="600">
									Chat {chat.id.slice(0, 8)}...
								</Text>
								<Text variant="caption" color="muted-foreground">
									Business: {chat.businessUserId.slice(0, 8)}...
								</Text>
								<Text variant="caption" color="muted-foreground">
									Client: {chat.clientUserId.slice(0, 8)}...
								</Text>
							</Box>
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
