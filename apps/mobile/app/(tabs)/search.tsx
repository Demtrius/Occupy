import { useState } from "react";
import { ScrollView } from "react-native";
import { CliqueCard } from "@/components/cards/clique-card";
import { UserCard } from "@/components/cards/user-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Box, Text } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { SearchInput } from "@/components/ui/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchQuery } from "@/hooks/use-search";
import type { SearchResult } from "@/types";

export default function Page() {
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounce(query, 300);

	const { data, isLoading } = useSearchQuery(
		debouncedQuery,
		debouncedQuery ? 20 : 0,
	);

	const results = (data as SearchResult) || {
		users: [],
		occupations: [],
		cliques: [],
	};

	const handleClear = () => {
		setQuery("");
	};

	return (
		<Screen>
			<Box padding="s" paddingBottom="s">
				<SearchInput
					placeholder="Search users, occupations, cliques..."
					value={query}
					autoCapitalize="none"
					onChangeText={setQuery}
					onClear={handleClear}
				/>
			</Box>
			<ScrollView showsVerticalScrollIndicator={false}>
				<Box padding="s">
					{query ? (
						<>
							{/* Users */}
							{results.users.length > 0 && (
								<Box marginBottom="l">
									<Text variant="header" marginBottom="s">
										Users
									</Text>
									{results.users.map((user) => (
										<UserCard key={user.id} user={user} />
									))}
								</Box>
							)}

							{/* Occupations */}
							{results.occupations.length > 0 && (
								<Box marginBottom="l">
									<Text variant="header" marginBottom="s">
										Occupations
									</Text>
									{results.occupations.map((occupation) => (
										<Box
											key={occupation.id}
											backgroundColor="card"
											borderRadius="m"
											padding="m"
											marginBottom="s"
											borderWidth={1}
											borderColor="border"
										>
											<Text variant="body" fontWeight="600">
												{occupation.name}
											</Text>
										</Box>
									))}
								</Box>
							)}

							{/* Cliques */}
							{results.cliques.length > 0 && (
								<Box marginBottom="l">
									<Text variant="header" marginBottom="s">
										Cliques
									</Text>
									{results.cliques.map((clique) => (
										<CliqueCard key={clique.id} clique={clique} />
									))}
								</Box>
							)}

							{results.users.length === 0 &&
								results.occupations.length === 0 &&
								results.cliques.length === 0 &&
								!isLoading && <EmptyState message="No results found" />}
						</>
					) : (
						<EmptyState message="Start typing to search" />
					)}
				</Box>
			</ScrollView>
		</Screen>
	);
}
