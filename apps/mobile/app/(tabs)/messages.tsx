import { useState } from "react";
import { ScrollView } from "react-native";
import { Screen } from "@/components/screen";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Text } from "@/components/ui/restyle-components";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { useListChatsQuery } from "@/hooks/use-messaging";

export default function Page() {
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
			<Box padding="m" paddingBottom="s">
				<SearchInput
					placeholder="Search conversations..."
					value={searchQuery}
					onChangeText={setSearchQuery}
					onClear={handleClearSearch}
				/>
			</Box>
			<ScrollView showsVerticalScrollIndicator={false}>
				<Box padding="m">
					{isLoading ? (
						<EmptyState message="Loading conversations..." />
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
