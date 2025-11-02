import { Ionicons } from "@expo/vector-icons";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useTheme } from "@shopify/restyle";
import { type } from "arktype";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionSheetIOS, Platform, Pressable, ScrollView } from "react-native";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-utils";
import { Input } from "@/components/ui/input";
import { AppModal } from "@/components/ui/modal";
import { Box, Text } from "@/components/ui/restyle-components";
import { Switch } from "@/components/ui/switch";
import type { Theme } from "@/config/theme";

const schema = type({
	title: "string > 0",
	description: "string | null | undefined",
	price: "string | null | undefined",
	currency: "string > 0",
	durationMinutes: "string > 0",
	bufferMinutes: "string | null | undefined",
	isActive: "boolean = true",
}).narrow((data) => {
	const duration = Number.parseInt(data.durationMinutes, 10);
	if (Number.isNaN(duration) || duration <= 0) {
		throw new Error("Duration must be a positive number.");
	}

	const bufferRaw =
		data.bufferMinutes && data.bufferMinutes.trim().length > 0
			? data.bufferMinutes
			: "0";
	const buffer = Number.parseInt(bufferRaw, 10);
	if (Number.isNaN(buffer) || buffer < 0) {
		throw new Error("Buffer minutes cannot be negative.");
	}

	if (data.price && data.price.trim().length > 0) {
		const priceValue = Number.parseFloat(data.price);
		if (Number.isNaN(priceValue) || priceValue < 0) {
			throw new Error("Price must be a valid positive number.");
		}
	}

	return true;
});

export type ServiceFormValues = typeof schema.infer;

export interface ServiceFormSubmitPayload {
	title: string;
	description: string | null;
	priceMinor: number | null;
	currency: string;
	durationMinutes: number;
	bufferMinutes: number;
	isActive: boolean;
}

export interface ServiceFormProps {
	initialValues?: Partial<ServiceFormValues>;
	defaultCurrency?: string | null;
	onSubmit: (values: ServiceFormSubmitPayload) => Promise<void> | void;
	isSubmitting?: boolean;
	submitLabel?: string;
	allowCurrencyEdit?: boolean;
}

const DEFAULT_VALUES: ServiceFormValues = {
	title: "",
	description: "",
	price: "",
	currency: "USD",
	durationMinutes: "60",
	bufferMinutes: "0",
	isActive: true,
};

function normalizeCurrency(code: string | undefined | null) {
	const normalized = (code ?? "USD").trim().toUpperCase();
	return normalized || "USD";
}

export function ServiceForm({
	initialValues,
	defaultCurrency,
	onSubmit,
	isSubmitting = false,
	submitLabel = "Save Service",
	allowCurrencyEdit = true,
}: ServiceFormProps) {
	const theme = useTheme<Theme>();
	const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);

	const {
		control,
		handleSubmit,
		formState,
		reset,
		watch,
		setValue,
		getValues,
	} = useForm<ServiceFormValues>({
		resolver: arktypeResolver(schema),
		mode: "onChange",
		defaultValues: {
			...DEFAULT_VALUES,
			currency: normalizeCurrency(defaultCurrency),
		},
	});

	useEffect(() => {
		const currentValues = {
			...DEFAULT_VALUES,
			currency: normalizeCurrency(
				initialValues?.currency ?? defaultCurrency ?? DEFAULT_VALUES.currency,
			),
			...initialValues,
		};
		reset(currentValues);
	}, [defaultCurrency, initialValues, reset]);

	const currency = watch("currency");

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

		const set = new Set(base);
		set.add(normalizeCurrency(defaultCurrency));
		set.add(normalizeCurrency(currency));
		return Array.from(set).sort();
	}, [currency, defaultCurrency]);

	const closeCurrencyPicker = useCallback(() => {
		setIsCurrencyPickerOpen(false);
	}, []);

	const handleCurrencySelect = useCallback(
		(code: string) => {
			setValue("currency", normalizeCurrency(code), {
				shouldDirty: true,
				shouldValidate: true,
			});
			setIsCurrencyPickerOpen(false);
		},
		[setValue],
	);

	const openCurrencyPicker = useCallback(() => {
		if (isSubmitting || !allowCurrencyEdit) return;
		if (Platform.OS === "ios") {
			const options = [...currencyOptions, "Cancel"];
			ActionSheetIOS.showActionSheetWithOptions(
				{
					options,
					cancelButtonIndex: options.length - 1,
				},
				(selectedIndex) => {
					if (
						selectedIndex == null ||
						selectedIndex < 0 ||
						selectedIndex >= options.length - 1
					) {
						return;
					}
					const selected = options[selectedIndex];
					if (selected) {
						handleCurrencySelect(selected);
					}
				},
			);
			return;
		}
		setIsCurrencyPickerOpen(true);
	}, [allowCurrencyEdit, currencyOptions, handleCurrencySelect, isSubmitting]);

	const parsePriceMinor = useCallback((input: string | null | undefined) => {
		if (!input || !input.trim()) {
			return null;
		}
		const value = Number.parseFloat(input);
		if (Number.isNaN(value) || value < 0) {
			throw new Error("Price must be a valid positive number.");
		}
		return Math.round(value * 100);
	}, []);

	const handleFormSubmit = useCallback(
		async (values: ServiceFormValues) => {
			const trimmedTitle = values.title.trim();
			const duration = Number.parseInt(values.durationMinutes, 10);
			const buffer = Number.parseInt(
				(values.bufferMinutes && values.bufferMinutes.trim()) || "0",
				10,
			);

			const payload: ServiceFormSubmitPayload = {
				title: trimmedTitle,
				description: values.description?.trim()
					? values.description.trim()
					: null,
				priceMinor: parsePriceMinor(values.price),
				currency: normalizeCurrency(values.currency),
				durationMinutes: duration,
				bufferMinutes: buffer,
				isActive: values.isActive,
			};

			await onSubmit(payload);
		},
		[onSubmit, parsePriceMinor],
	);

	return (
		<>
			<ScrollView
				contentContainerStyle={{
					paddingBottom: theme.spacing.m,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<Box gap="m">
					<FormField
						name="title"
						control={control}
						label="Title"
						render={({ value, onChange, onBlur }) => (
							<Input
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								placeholder="e.g. Signature facial"
								editable={!isSubmitting}
							/>
						)}
					/>

					<FormField
						name="description"
						control={control}
						label="Description"
						render={({ value, onChange, onBlur }) => (
							<Input
								value={value ?? ""}
								onChangeText={onChange}
								onBlur={onBlur}
								placeholder="Describe the service..."
								multiline
								numberOfLines={4}
								textAlignVertical="top"
								style={{
									minHeight: 120,
									paddingTop: theme.spacing.s,
								}}
								editable={!isSubmitting}
							/>
						)}
					/>

					<Box gap="s">
						<Box flexDirection="row" gap="s">
							<FormField
								name="price"
								control={control}
								label="Amount"
								render={({ value, onChange, onBlur }) => (
									<Input
										value={value ?? ""}
										onChangeText={(text) =>
											onChange(text.replace(/[^0-9.]/g, ""))
										}
										onBlur={onBlur}
										keyboardType="decimal-pad"
										placeholder="Amount (e.g. 120.00)"
										editable={!isSubmitting}
									/>
								)}
							/>
							<Box flexGrow={1}>
								<Text variant="label" fontWeight="600" marginBottom="s">
									Currency
								</Text>
								<Pressable
									onPress={openCurrencyPicker}
									disabled={isSubmitting || !allowCurrencyEdit}
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
											{getValues("currency")}
										</Text>
										{allowCurrencyEdit ? (
											<Ionicons
												name="chevron-down"
												size={18}
												color={theme.colors["muted-foreground"]}
											/>
										) : null}
									</Box>
								</Pressable>
							</Box>
						</Box>
					</Box>

					<Box flexDirection="row" gap="s">
						<FormField
							name="durationMinutes"
							control={control}
							label="Duration (minutes)"
							render={({ value, onChange, onBlur }) => (
								<Input
									value={value}
									onChangeText={(text) =>
										onChange(text.replace(/[^0-9]/g, "") || "")
									}
									onBlur={onBlur}
									keyboardType="number-pad"
									editable={!isSubmitting}
								/>
							)}
						/>
						<FormField
							name="bufferMinutes"
							control={control}
							label="Buffer (minutes)"
							render={({ value, onChange, onBlur, error }) => (
								<Input
									value={value ?? ""}
									onChangeText={(text) =>
										onChange(text.replace(/[^0-9]/g, "") || "")
									}
									onBlur={onBlur}
									keyboardType="number-pad"
									editable={!isSubmitting}
								/>
							)}
						/>
					</Box>

					<FormField
						name="isActive"
						control={control}
						render={({ value, onChange }) => (
							<Box
								flexDirection="row"
								alignItems="center"
								justifyContent="space-between"
							>
								<Text variant="body" fontWeight="500">
									Active
								</Text>
								<Switch
									value={Boolean(value)}
									onValueChange={onChange}
									disabled={isSubmitting}
								/>
							</Box>
						)}
					/>

					<Button
						variant="primary"
						onPress={handleSubmit(handleFormSubmit)}
						disabled={!formState.isValid || isSubmitting}
					>
						{isSubmitting ? "Saving..." : submitLabel}
					</Button>
				</Box>
			</ScrollView>

			{Platform.OS !== "ios" && allowCurrencyEdit ? (
				<AppModal
					visible={isCurrencyPickerOpen}
					onClose={closeCurrencyPicker}
					title="Select Currency"
					dismissOnBackdropPress={!isSubmitting}
					footer={
						<Box flexDirection="row" justifyContent="flex-end">
							<Button variant="ghost" onPress={closeCurrencyPicker}>
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
