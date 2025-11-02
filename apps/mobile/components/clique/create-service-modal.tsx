import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionSheetIOS, Platform, Pressable, ScrollView } from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppModal } from "@/components/ui/modal";
import { Box, Text } from "@/components/ui/restyle-components";
import { Switch } from "@/components/ui/switch";
import type { Theme } from "@/config/theme";
import { useCreateServiceMutation } from "@/hooks/use-services";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type { Service } from "@/types";

interface CreateServiceModalProps {
	visible: boolean;
	cliqueId: string;
	defaultCurrency?: string | null;
	onClose: () => void;
	onCreated?: (service: Service) => void;
}

export function CreateServiceModal({
	visible,
	cliqueId,
	defaultCurrency = "USD",
	onClose,
	onCreated,
}: CreateServiceModalProps) {
	const theme = useTheme<Theme>();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [currency, setCurrency] = useState(
		(defaultCurrency ?? "USD").toUpperCase(),
	);
	const [durationMinutes, setDurationMinutes] = useState("60");
	const [bufferMinutes, setBufferMinutes] = useState("0");
	const [isActive, setIsActive] = useState(true);
	const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);

	const createServiceMutation = useCreateServiceMutation();

	useEffect(() => {
		if (visible) {
			setCurrency((defaultCurrency ?? "USD").toUpperCase());
			setIsCurrencyPickerOpen(false);
		} else {
			setTitle("");
			setDescription("");
			setPrice("");
			setDurationMinutes("60");
			setBufferMinutes("0");
			setIsActive(true);
		}
	}, [visible, defaultCurrency]);

	const isSubmitting = createServiceMutation.isPending;

	const currencyOptions = useMemo(() => {
		const base = [
			"USD",
			"EUR",
			"GBP",
			"CAD",
			"AUD",
			"NZD",
			"JPY",
			"SEK",
			"CHF",
		];
		const normalizedDefault = (defaultCurrency ?? "USD").toUpperCase();
		const set = new Set(base.map((code) => code.toUpperCase()));
		set.add(normalizedDefault);
		set.add(currency.toUpperCase());
		return Array.from(set).sort();
	}, [currency, defaultCurrency]);

	const isFormValid = useMemo(() => {
		if (!title.trim()) return false;
		if (!currency.trim()) return false;
		const duration = Number.parseInt(durationMinutes, 10);
		if (Number.isNaN(duration) || duration <= 0) return false;
		const buffer = Number.parseInt(bufferMinutes || "0", 10);
		if (Number.isNaN(buffer) || buffer < 0) return false;
		if (price.trim().length > 0) {
			const value = Number.parseFloat(price);
			if (Number.isNaN(value) || value < 0) return false;
		}
		return true;
	}, [title, currency, durationMinutes, bufferMinutes, price]);

	const parsePriceMinor = (input: string): number | null => {
		if (!input.trim()) return null;
		const value = Number.parseFloat(input);
		if (Number.isNaN(value) || value < 0) {
			throw new Error("Price must be a valid positive number.");
		}
		return Math.round(value * 100);
	};

	const handleSubmit = useCallback(async () => {
		if (!cliqueId) {
			showToast({ type: "error", message: "Missing clique context." });
			return;
		}
		try {
			const trimmedTitle = title.trim();
			if (!trimmedTitle) {
				showToast({ type: "error", message: "Title is required." });
				return;
			}

			const duration = Number.parseInt(durationMinutes, 10);
			const buffer = Number.parseInt(bufferMinutes || "0", 10);
			if (Number.isNaN(duration) || duration <= 0) {
				showToast({
					type: "error",
					message: "Duration must be a positive number.",
				});
				return;
			}
			if (Number.isNaN(buffer) || buffer < 0) {
				showToast({
					type: "error",
					message: "Buffer minutes cannot be negative.",
				});
				return;
			}

			const priceMinor = parsePriceMinor(price);

			const result = await createServiceMutation.mutateAsync({
				params: {
					query: { cliqueId },
				},
				body: {
					title: trimmedTitle,
					description: description.trim() || null,
					priceMinor: priceMinor ?? null,
					currency: currency.trim().toUpperCase(),
					durationMinutes: duration,
					bufferMinutes: buffer,
					isActive,
				},
			});

			showToast({ type: "success", message: "Service created" });
			onCreated?.(result);
			onClose();
		} catch (error: unknown) {
			showToast({
				type: "error",
				message: getErrorMessage(error, "Failed to create service"),
			});
		}
	}, [
		bufferMinutes,
		cliqueId,
		createServiceMutation,
		currency,
		description,
		durationMinutes,
		isActive,
		onClose,
		onCreated,
		price,
		title,
	]);

	const handleCurrencySelect = useCallback((code: string) => {
		setCurrency(code.toUpperCase());
		setIsCurrencyPickerOpen(false);
	}, []);

	const openCurrencyPicker = useCallback(() => {
		if (isSubmitting) return;
		if (Platform.OS === "ios") {
			const options = [...currencyOptions, "Cancel"];
			ActionSheetIOS.showActionSheetWithOptions(
				{
					options,
					cancelButtonIndex: options.length - 1,
				},
				(selectedIndex) => {
					if (selectedIndex === undefined || selectedIndex < 0) return;
					if (selectedIndex === options.length - 1) return;
					const selected = options[selectedIndex];
					if (!selected) return;
					handleCurrencySelect(selected);
				},
			);
			return;
		}
		setIsCurrencyPickerOpen(true);
	}, [currencyOptions, handleCurrencySelect, isSubmitting]);

	const footer = (
		<Box flexDirection="row" justifyContent="flex-end" gap="s">
			<Button
				variant="primary"
				onPress={handleSubmit}
				style={{ width: "100%" }}
				disabled={!isFormValid || isSubmitting}
			>
				{isSubmitting ? "Creating..." : "Create Service"}
			</Button>
		</Box>
	);

	return (
		<>
			<AppModal
				visible={visible}
				onClose={onClose}
				title="Create Service"
				footer={footer}
			>
				<ScrollView
					contentContainerStyle={{ paddingBottom: theme.spacing.m }}
					keyboardShouldPersistTaps="handled"
				>
					<Box gap="m">
						<Box>
							<Text
								variant="caption"
								color="muted-foreground"
								marginBottom="xs"
							>
								Title
							</Text>
							<Input
								value={title}
								onChangeText={setTitle}
								placeholder="e.g. Signature facial"
								editable={!isSubmitting}
							/>
						</Box>
						<Box>
							<Text
								variant="caption"
								color="muted-foreground"
								marginBottom="xs"
							>
								Description
							</Text>
							<Input
								value={description}
								onChangeText={setDescription}
								placeholder="Describe the service..."
								multiline
								numberOfLines={4}
								textAlignVertical="top"
								style={{ minHeight: 120, paddingTop: theme.spacing.s }}
								editable={!isSubmitting}
							/>
						</Box>
						<Box gap="s">
							<Text variant="caption" color="muted-foreground">
								Pricing
							</Text>
							<Box flexDirection="row" gap="s">
								<Box flex={2}>
									<Text
										variant="caption"
										color="muted-foreground"
										marginBottom="xs"
									>
										Amount
									</Text>
									<Input
										value={price}
										onChangeText={setPrice}
										keyboardType="decimal-pad"
										placeholder="Amount (e.g. 120.00)"
										editable={!isSubmitting}
									/>
								</Box>
								<Box flex={1}>
									<Text
										variant="caption"
										color="muted-foreground"
										marginBottom="xs"
									>
										Currency
									</Text>
									<Pressable
										onPress={openCurrencyPicker}
										disabled={isSubmitting}
									>
										<Box
											borderRadius="m"
											paddingHorizontal="m"
											backgroundColor="card"
											borderWidth={1}
											borderColor="border"
											flexDirection="row"
											alignItems="center"
											justifyContent="space-between"
											style={{ paddingVertical: 11 }}
										>
											<Text variant="caption" fontWeight="600">
												{currency}
											</Text>
											<Ionicons
												name="chevron-down"
												size={18}
												color={theme.colors["muted-foreground"]}
											/>
										</Box>
									</Pressable>
								</Box>
							</Box>
						</Box>
						<Box flexDirection="row" gap="s">
							<Box flex={1}>
								<Text
									variant="caption"
									color="muted-foreground"
									marginBottom="xs"
								>
									Duration (minutes)
								</Text>
								<Input
									value={durationMinutes}
									onChangeText={setDurationMinutes}
									keyboardType="number-pad"
									editable={!isSubmitting}
								/>
							</Box>
							<Box flex={1}>
								<Text
									variant="caption"
									color="muted-foreground"
									marginBottom="xs"
								>
									Buffer (minutes)
								</Text>
								<Input
									value={bufferMinutes}
									onChangeText={setBufferMinutes}
									keyboardType="number-pad"
									editable={!isSubmitting}
								/>
							</Box>
						</Box>
						<Box
							flexDirection="row"
							alignItems="center"
							justifyContent="space-between"
						>
							<Text variant="body" fontWeight="500">
								Active
							</Text>
							<Switch
								value={isActive}
								onValueChange={setIsActive}
								disabled={isSubmitting}
							/>
						</Box>
					</Box>
				</ScrollView>
			</AppModal>
			{Platform.OS !== "ios" ? (
				<AppModal
					visible={isCurrencyPickerOpen}
					onClose={() => setIsCurrencyPickerOpen(false)}
					title="Select Currency"
					dismissOnBackdropPress={!isSubmitting}
					footer={
						<Box flexDirection="row" justifyContent="flex-end">
							<Button
								variant="ghost"
								onPress={() => setIsCurrencyPickerOpen(false)}
							>
								Close
							</Button>
						</Box>
					}
				>
					<ScrollView
						contentContainerStyle={{ paddingBottom: theme.spacing.m }}
						keyboardShouldPersistTaps="handled"
					>
						<Box gap="s">
							{currencyOptions.map((code) => {
								const isSelected = currency === code;
								return (
									<Pressable
										key={code}
										onPress={() => handleCurrencySelect(code)}
										disabled={isSubmitting}
									>
										<Box
											borderRadius="m"
											paddingHorizontal="m"
											paddingVertical="s"
											backgroundColor={isSelected ? "primary" : "secondary"}
										>
											<Text
												variant="body"
												fontWeight={isSelected ? "600" : "500"}
												color={isSelected ? "primary-foreground" : "foreground"}
											>
												{code}
											</Text>
										</Box>
									</Pressable>
								);
							})}
						</Box>
					</ScrollView>
				</AppModal>
			) : null}
		</>
	);
}
