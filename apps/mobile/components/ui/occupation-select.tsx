import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	TouchableOpacity,
} from "react-native";
import type { Theme } from "@/config/theme";
import { Button } from "./button";
import { Box, Input, Text } from "./restyle-components";

interface Occupation {
	id: string;
	name: string;
	slug: string;
}

interface OccupationSelectProps {
	value?: string[];
	onChange: (value: string[]) => void;
	occupations: Occupation[];
	loading?: boolean;
	onCreateOccupation?: (name: string) => void;
	placeholder?: string;
}

export function OccupationSelect({
	value = [],
	onChange,
	occupations,
	loading = false,
	onCreateOccupation,
	placeholder = "Select occupations...",
}: OccupationSelectProps) {
	const theme = useTheme<Theme>();
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const selectedOccupations = useMemo(() => {
		return occupations.filter((occ) => value.includes(occ.id));
	}, [occupations, value]);

	const filteredOccupations = useMemo(() => {
		if (!searchQuery.trim()) return occupations;
		return occupations.filter((occ) =>
			occ.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [occupations, searchQuery]);

	const hasExactMatch = useMemo(() => {
		return occupations.some(
			(occ) => occ.name.toLowerCase() === searchQuery.toLowerCase().trim(),
		);
	}, [occupations, searchQuery]);

	const handleSelectOccupation = (occupationId: string) => {
		const newValue = value.includes(occupationId)
			? value.filter((id) => id !== occupationId)
			: [...value, occupationId];
		onChange(newValue);
	};

	const handleCreateOccupation = () => {
		if (onCreateOccupation && searchQuery.trim()) {
			onCreateOccupation(searchQuery.trim());
			setSearchQuery("");
		}
	};

	const handleRemoveOccupation = (occupationId: string) => {
		onChange(value.filter((id) => id !== occupationId));
	};

	return (
		<>
			{/* Selected occupations display */}
			<TouchableOpacity onPress={() => setIsOpen(true)}>
				<Box
					minHeight={44}
					borderRadius="m"
					paddingHorizontal="m"
					paddingVertical="s"
					backgroundColor="card"
					borderWidth={1}
					borderColor="border"
					shadowColor="ring"
					shadowOffset={{ width: 0, height: 2 }}
					shadowOpacity={0.12}
					shadowRadius={4}
					elevation={2}
					flexDirection="row"
					alignItems="center"
					justifyContent="space-between"
				>
					<Box flex={1} flexDirection="row" flexWrap="wrap" gap="xs">
						{selectedOccupations.length > 0 ? (
							selectedOccupations.map((occupation) => (
								<Box
									key={occupation.id}
									backgroundColor="primary"
									borderRadius="s"
									paddingHorizontal="s"
									paddingVertical="xs"
									flexDirection="row"
									alignItems="center"
									gap="xs"
								>
									<Text variant="caption" color="primary-foreground">
										{occupation.name}
									</Text>
									<TouchableOpacity
										onPress={() => handleRemoveOccupation(occupation.id)}
										hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									>
										<Ionicons
											name="close"
											size={14}
											color={theme.colors["primary-foreground"]}
										/>
									</TouchableOpacity>
								</Box>
							))
						) : (
							<Text color="muted-foreground">{placeholder}</Text>
						)}
					</Box>
					<Ionicons
						name={isOpen ? "chevron-up" : "chevron-down"}
						size={20}
						color={theme.colors["muted-foreground"]}
					/>
				</Box>
			</TouchableOpacity>

			{/* Modal for selection */}
			<Modal
				visible={isOpen}
				animationType="fade"
				transparent
				onRequestClose={() => setIsOpen(false)}
			>
				<TouchableOpacity
					style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
					activeOpacity={1}
					onPress={() => setIsOpen(false)}
				>
					<Box
						position="absolute"
						bottom={0}
						left={0}
						right={0}
						backgroundColor="background"
						borderTopLeftRadius="l"
						borderTopRightRadius="l"
						maxHeight="70%"
						padding="m"
					>
						{/* Search input */}
						<Box
							marginBottom="s"
							paddingBottom="s"
							borderBottomColor="muted"
							borderBottomWidth={2}
						>
							<Input
								placeholder="Search occupations..."
								value={searchQuery}
								onChangeText={setSearchQuery}
								autoFocus
							/>
						</Box>

						{/* Occupation list */}
						{loading ? (
							<Box alignItems="center" justifyContent="center" padding="l">
								<ActivityIndicator size="large" />
							</Box>
						) : (
							<FlatList
								style={{ paddingVertical: theme.spacing.s }}
								data={filteredOccupations}
								keyExtractor={(item) => item.id}
								renderItem={({ item }) => (
									<TouchableOpacity
										onPress={() => handleSelectOccupation(item.id)}
										style={{ marginBottom: theme.spacing.s }}
									>
										<Box
											flexDirection="row"
											alignItems="center"
											justifyContent="space-between"
											paddingHorizontal="m"
											paddingVertical="s"
											backgroundColor={
												value.includes(item.id) ? "primary" : "card"
											}
											borderRadius="m"
											borderWidth={1}
											borderColor={
												value.includes(item.id) ? "primary" : "border"
											}
											minHeight={40}
										>
											<Text
												color={
													value.includes(item.id)
														? "primary-foreground"
														: "foreground"
												}
											>
												{item.name}
											</Text>
											{value.includes(item.id) && (
												<Ionicons
													name="checkmark"
													size={18}
													color={theme.colors["primary-foreground"]}
												/>
											)}
										</Box>
									</TouchableOpacity>
								)}
								ListEmptyComponent={
									searchQuery.trim() && !hasExactMatch ? (
										<Box padding="s" alignItems="center">
											<Text color="muted-foreground" marginBottom="m">
												No occupations found with "{searchQuery}"
											</Text>
											{onCreateOccupation && (
												<Box width="100%">
													<Button
														variant="secondary"
														onPress={handleCreateOccupation}
													>
														Create "{searchQuery}"
													</Button>
												</Box>
											)}
										</Box>
									) : (
										<Text color="muted-foreground" textAlign="center">
											{searchQuery.trim()
												? "No occupations found"
												: "No occupations available"}
										</Text>
									)
								}
								showsVerticalScrollIndicator={false}
							/>
						)}

						{/* Done button */}
						<Box marginTop="m" marginBottom="xl">
							<Button onPress={() => setIsOpen(false)}>
								<Text>Done</Text>
							</Button>
						</Box>
					</Box>
				</TouchableOpacity>
			</Modal>
		</>
	);
}
