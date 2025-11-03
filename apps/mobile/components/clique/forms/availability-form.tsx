import { Ionicons } from "@expo/vector-icons";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useTheme } from "@shopify/restyle";
import { type } from "arktype";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FlatList, Pressable, ScrollView } from "react-native";
import DatePicker from "react-native-date-picker";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { FormField } from "@/components/ui/form-utils";
import { Input } from "@/components/ui/input";
import { Box, Text } from "@/components/ui/restyle-components";
import { Switch } from "@/components/ui/switch";
import type { Theme } from "@/config/theme";

const DAYS = [
	{ label: "Mon", value: 0 },
	{ label: "Tue", value: 1 },
	{ label: "Wed", value: 2 },
	{ label: "Thu", value: 3 },
	{ label: "Fri", value: 4 },
	{ label: "Sat", value: 5 },
	{ label: "Sun", value: 6 },
];

type PickerField =
	| "startTime"
	| "endTime"
	| "date"
	| "validFrom"
	| "validUntil";

const pickerTitles: Record<PickerField, string> = {
	startTime: "Select Start Time",
	endTime: "Select End Time",
	date: "Select Date",
	validFrom: "Select Start Date",
	validUntil: "Select End Date",
};

const schema = type({
	isRecurring: "boolean = true",
	dayOfWeek: "number | null | undefined",
	date: "string | null | undefined",
	startTime: "string > 0",
	endTime: "string > 0",
	validFrom: "string | null | undefined",
	validUntil: "string | null | undefined",
	timezone: "string > 0",
}).narrow((data) => {
	if (data.isRecurring) {
		if (data.dayOfWeek == null || data.dayOfWeek < 0 || data.dayOfWeek > 6) {
			throw new Error("Select a day of the week for recurring availability.");
		}
	} else if (!data.date || !data.date.trim()) {
		throw new Error("Provide a date in YYYY-MM-DD format.");
	}

	if (!isValidTime(data.startTime)) {
		throw new Error("Start time must be in HH:MM format.");
	}
	if (!isValidTime(data.endTime)) {
		throw new Error("End time must be in HH:MM format.");
	}
	if (!data.timezone.trim()) {
		throw new Error("Timezone is required.");
	}

	return true;
});

export type AvailabilityFormValues = typeof schema.infer;

export interface AvailabilityFormSubmitPayload {
	isRecurring: boolean;
	dayOfWeek: number | null;
	date: string | null;
	startTime: string;
	endTime: string;
	validFrom: string | null;
	validUntil: string | null;
	timezone: string;
}

export interface AvailabilityFormProps {
	initialValues?: Partial<AvailabilityFormValues>;
	defaultTimezone?: string | null;
	onSubmit: (values: AvailabilityFormSubmitPayload) => Promise<void> | void;
	isSubmitting?: boolean;
	submitLabel?: string;
}

const DEFAULT_VALUES: AvailabilityFormValues = {
	isRecurring: true,
	dayOfWeek: 0,
	date: "",
	startTime: "09:00",
	endTime: "17:00",
	validFrom: "",
	validUntil: "",
	timezone: "UTC",
};

function toTimeString(date: Date): string {
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	return `${hours}:${minutes}`;
}

function toDateString(date: Date): string {
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function parseTimeString(value: string | null | undefined): Date {
	const now = new Date();
	now.setSeconds(0, 0);
	if (!value) {
		return now;
	}
	const [hours = "0", minutes = "0"] = value.split(":");
	now.setHours(Number.parseInt(hours, 10) || 0);
	now.setMinutes(Number.parseInt(minutes, 10) || 0);
	return now;
}

function parseDateString(value: string | null | undefined): Date {
	const today = new Date();
	today.setHours(12, 0, 0, 0);
	if (!value) {
		return today;
	}
	const [yearStr, monthStr, dayStr] = value.split("-");
	const year = Number.parseInt(yearStr ?? "", 10) || today.getFullYear();
	const month = Number.parseInt(monthStr ?? "", 10) - 1;
	const day = Number.parseInt(dayStr ?? "", 10) || 1;
	const parsed = new Date();
	parsed.setFullYear(year, Math.max(0, month), day);
	parsed.setHours(12, 0, 0, 0);
	return parsed;
}

function normalizeTime(input: string): string {
	const trimmed = input.trim();
	const [hours = "00", minutes = "00"] = trimmed.split(":");
	return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
}

function isValidTime(input: string | null | undefined): boolean {
	if (!input) return false;
	const regex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
	return regex.test(input.trim());
}

export function AvailabilityForm({
	initialValues,
	defaultTimezone,
	onSubmit,
	isSubmitting = false,
	submitLabel = "Save Availability",
}: AvailabilityFormProps) {
	const theme = useTheme<Theme>();
	const [pickerState, setPickerState] = useState<{
		field: PickerField;
		mode: "date" | "time";
		value: Date;
		onChange: (value: string) => void;
	} | null>(null);

	const { control, handleSubmit, formState, reset, watch, setValue } =
		useForm<AvailabilityFormValues>({
			resolver: arktypeResolver(schema),
			mode: "onChange",
			defaultValues: {
				...DEFAULT_VALUES,
				timezone: (defaultTimezone ?? DEFAULT_VALUES.timezone).trim(),
			},
		});

	useEffect(() => {
		const values = {
			...DEFAULT_VALUES,
			timezone: (defaultTimezone ?? DEFAULT_VALUES.timezone).trim(),
			...initialValues,
		};
		if (!values.isRecurring) {
			values.dayOfWeek = null;
		}
		reset(values);
	}, [defaultTimezone, initialValues, reset]);

	const isRecurring = watch("isRecurring");
	const dayOfWeek = watch("dayOfWeek");
	const date = watch("date");
	const startTime = watch("startTime");
	const endTime = watch("endTime");
	const validFrom = watch("validFrom");
	const validUntil = watch("validUntil");

	const openTimePicker = useCallback(
		(
			field: Extract<PickerField, "startTime" | "endTime">,
			value: string,
			onChange: (val: string) => void,
		) => {
			setPickerState({
				field,
				mode: "time",
				value: parseTimeString(value),
				onChange,
			});
		},
		[],
	);

	const openDatePicker = useCallback(
		(
			field: Extract<PickerField, "date" | "validFrom" | "validUntil">,
			value: string,
			onChange: (val: string) => void,
		) => {
			setPickerState({
				field,
				mode: "date",
				value: parseDateString(value),
				onChange,
			});
		},
		[],
	);

	const handlePickerCancel = useCallback(() => {
		setPickerState(null);
	}, []);

	const handlePickerConfirm = useCallback(
		(selected: Date) => {
			if (!pickerState) return;
			let formatted: string;
			if (pickerState.mode === "time") {
				formatted = toTimeString(selected);
			} else {
				formatted = toDateString(selected);
			}
			pickerState.onChange(formatted);
			setPickerState(null);
		},
		[pickerState],
	);

	const handleFormSubmit = useCallback(
		async (values: AvailabilityFormValues) => {
			const payload: AvailabilityFormSubmitPayload = {
				isRecurring: values.isRecurring,
				dayOfWeek: values.isRecurring ? (values.dayOfWeek ?? null) : null,
				date: values.isRecurring ? null : values.date?.trim() || null,
				startTime: normalizeTime(values.startTime),
				endTime: normalizeTime(values.endTime),
				validFrom: values.isRecurring ? values.validFrom?.trim() || null : null,
				validUntil: values.isRecurring
					? values.validUntil?.trim() || null
					: null,
				timezone: values.timezone.trim(),
			};

			await onSubmit(payload);
		},
		[onSubmit],
	);

	const handleDaySelect = useCallback(
		(value: number) => {
			setValue("dayOfWeek", value, {
				shouldValidate: true,
				shouldDirty: true,
			});
		},
		[setValue],
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
						name="isRecurring"
						control={control}
						render={({ value, onChange }) => (
							<Box
								flexDirection="row"
								alignItems="center"
								justifyContent="space-between"
							>
								<Text variant="body" fontWeight="500">
									Recurring weekly
								</Text>
								<Switch
									value={Boolean(value)}
									onValueChange={onChange}
									disabled={isSubmitting}
								/>
							</Box>
						)}
					/>

					{isRecurring ? (
						<Box>
							<Text
								variant="caption"
								color="muted-foreground"
								marginBottom="xs"
							>
								Day of week
							</Text>
							<FlatList
								data={DAYS}
								scrollEnabled={false}
								numColumns={3}
								contentContainerStyle={{
									width: "100%",
								}}
								columnWrapperStyle={{
									justifyContent: "space-between",
									gap: theme.spacing.s,
									marginBottom: theme.spacing.s,
								}}
								renderItem={({ item }) => {
									const isSelected = dayOfWeek === item.value;
									return (
										<Pressable
											onPress={() => handleDaySelect(item.value)}
											disabled={isSubmitting}
											style={{
												flex: 1,
												width: "30%",
											}}
										>
											<Box
												paddingHorizontal="m"
												paddingVertical="s"
												borderRadius="m"
												backgroundColor={isSelected ? "primary" : "secondary"}
											>
												<Text
													variant="caption"
													color={
														isSelected ? "primary-foreground" : "foreground"
													}
													fontWeight={isSelected ? "600" : "500"}
												>
													{item.label}
												</Text>
											</Box>
										</Pressable>
									);
								}}
								keyExtractor={(item) => item.value.toString()}
							/>
							{formState.errors.dayOfWeek ? (
								<FormMessage>{formState.errors.dayOfWeek.message}</FormMessage>
							) : null}
						</Box>
					) : (
						<FormField
							name="date"
							control={control}
							label="Date (YYYY-MM-DD)"
							render={({ value, onChange, error }) => (
								<SelectionInput
									value={value ?? ""}
									placeholder="Select date"
									onPress={() => openDatePicker("date", value ?? "", onChange)}
									disabled={isSubmitting}
									error={error?.message}
								/>
							)}
						/>
					)}

					<Box flexDirection="row" gap="s">
						<FormField
							name="startTime"
							control={control}
							label="Start time (HH:MM)"
							render={({ value, onChange, error }) => (
								<SelectionInput
									value={value}
									placeholder="09:00"
									onPress={() => openTimePicker("startTime", value, onChange)}
									disabled={isSubmitting}
									error={error?.message}
								/>
							)}
						/>
						<FormField
							name="endTime"
							control={control}
							label="End time (HH:MM)"
							render={({ value, onChange, error }) => (
								<SelectionInput
									value={value}
									placeholder="17:00"
									onPress={() => openTimePicker("endTime", value, onChange)}
									disabled={isSubmitting}
									error={error?.message}
								/>
							)}
						/>
					</Box>

					{isRecurring ? (
						<Box flexDirection="row" gap="s">
							<FormField
								name="validFrom"
								control={control}
								label="Valid from (optional)"
								render={({ value, onChange, error }) => (
									<SelectionInput
										value={value ?? ""}
										placeholder="Select date"
										onPress={() =>
											openDatePicker("validFrom", value ?? "", onChange)
										}
										disabled={isSubmitting}
										error={error?.message}
										onClear={
											value
												? () => onChange("") // clear
												: undefined
										}
									/>
								)}
							/>
							<FormField
								name="validUntil"
								control={control}
								label="Valid until (optional)"
								render={({ value, onChange, error }) => (
									<SelectionInput
										value={value ?? ""}
										placeholder="Select date"
										onPress={() =>
											openDatePicker("validUntil", value ?? "", onChange)
										}
										disabled={isSubmitting}
										error={error?.message}
										onClear={
											value
												? () => onChange("") // clear
												: undefined
										}
									/>
								)}
							/>
						</Box>
					) : null}

					<FormField
						name="timezone"
						control={control}
						label="Timezone"
						render={({ value, onChange, onBlur, error }) => (
							<Input
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								autoCapitalize="none"
								placeholder="UTC"
								editable={!isSubmitting}
							/>
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

			<DatePicker
				modal
				open={Boolean(pickerState)}
				date={pickerState?.value ?? new Date()}
				mode={pickerState?.mode ?? "date"}
				title={pickerState ? pickerTitles[pickerState.field] : undefined}
				confirmText="Select"
				cancelText="Cancel"
				onConfirm={handlePickerConfirm}
				onCancel={handlePickerCancel}
				minuteInterval={5}
			/>
		</>
	);
}

interface SelectionInputProps {
	value: string;
	placeholder: string;
	onPress: () => void;
	disabled?: boolean;
	error?: string;
	onClear?: () => void;
}

function SelectionInput({
	value,
	placeholder,
	onPress,
	disabled,
	error,
	onClear,
}: SelectionInputProps) {
	const theme = useTheme<Theme>();
	const displayValue = value?.trim() ? value : placeholder;
	return (
		<Box flex={1}>
			<Pressable
				onPress={onPress}
				disabled={disabled}
				style={{
					borderRadius: theme.borderRadii.m,
					borderWidth: 1,
					borderColor: error ? theme.colors.destructive : theme.colors.border,
					backgroundColor: theme.colors.card,
					paddingHorizontal: theme.spacing.m,
					paddingVertical: theme.spacing.s,
				}}
			>
				<Box
					flexDirection="row"
					alignItems="center"
					justifyContent="space-between"
				>
					<Text
						variant="body"
						color={value ? "foreground" : "muted-foreground"}
					>
						{displayValue}
					</Text>
					<Ionicons
						name="chevron-down"
						size={18}
						color={theme.colors["muted-foreground"]}
					/>
				</Box>
			</Pressable>
			{onClear && value ? (
				<Pressable
					onPress={onClear}
					disabled={disabled}
					style={{ marginTop: theme.spacing.xs }}
				>
					<Text variant="caption" color="muted-foreground">
						Clear
					</Text>
				</Pressable>
			) : null}
			{error ? <FormMessage>{error}</FormMessage> : null}
		</Box>
	);
}
