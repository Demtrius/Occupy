import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView } from "react-native";
import DatePicker from "react-native-date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppModal } from "@/components/ui/modal";
import { Box, Text } from "@/components/ui/restyle-components";
import { Switch } from "@/components/ui/switch";
import type { Theme } from "@/config/theme";
import { useCreateAvailabilityMutation } from "@/hooks/use-availability";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type { Availability } from "@/types";

const DAYS = [
	{ label: "Sun", value: 0 },
	{ label: "Mon", value: 1 },
	{ label: "Tue", value: 2 },
	{ label: "Wed", value: 3 },
	{ label: "Thu", value: 4 },
	{ label: "Fri", value: 5 },
	{ label: "Sat", value: 6 },
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
	if (!value) {
		const now = new Date();
		now.setSeconds(0, 0);
		return now;
	}
	const [hours = "0", minutes = "0"] = value.split(":");
	const date = new Date();
	date.setHours(Number.parseInt(hours, 10) || 0);
	date.setMinutes(Number.parseInt(minutes, 10) || 0);
	date.setSeconds(0, 0);
	return date;
}

function parseDateString(value: string | null | undefined): Date {
	if (!value) {
		const today = new Date();
		today.setHours(12, 0, 0, 0);
		return today;
	}
	const [yearStr, monthStr, dayStr] = value.split("-");
	const year = Number.parseInt(yearStr ?? "", 10) || new Date().getFullYear();
	const month = Number.parseInt(monthStr ?? "", 10) - 1;
	const day = Number.parseInt(dayStr ?? "", 10) || 1;
	const date = new Date();
	date.setFullYear(year, Math.max(0, month), day);
	date.setHours(12, 0, 0, 0);
	return date;
}

interface CreateAvailabilityModalProps {
	visible: boolean;
	cliqueId: string;
	defaultTimezone?: string | null;
	onClose: () => void;
	onCreated?: (availability: Availability) => void;
}

export function CreateAvailabilityModal({
	visible,
	cliqueId,
	defaultTimezone = "UTC",
	onClose,
	onCreated,
}: CreateAvailabilityModalProps) {
	const theme = useTheme<Theme>();
	const deviceTimezone = useMemo(() => {
		try {
			const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
			if (tz && tz.trim()) {
				return tz;
			}
		} catch (error) {
			// Ignore failures and fall back to provided default
		}
		return defaultTimezone ?? "UTC";
	}, [defaultTimezone]);
	const [isRecurring, setIsRecurring] = useState(true);
	const [dayOfWeek, setDayOfWeek] = useState<number>(1);
	const [date, setDate] = useState("");
	const [startTime, setStartTime] = useState("09:00");
	const [endTime, setEndTime] = useState("17:00");
	const [validFrom, setValidFrom] = useState("");
	const [validUntil, setValidUntil] = useState("");
	const [timezone, setTimezone] = useState(deviceTimezone);
	const [pickerState, setPickerState] = useState<{
		field: PickerField;
		mode: "date" | "time";
		value: Date;
	} | null>(null);

	const createAvailabilityMutation = useCreateAvailabilityMutation();

	useEffect(() => {
		if (visible) {
			setTimezone(deviceTimezone);
			setPickerState(null);
		} else {
			setIsRecurring(true);
			setDayOfWeek(1);
			setDate("");
			setStartTime("09:00");
			setEndTime("17:00");
			setValidFrom("");
			setValidUntil("");
		}
	}, [visible, deviceTimezone]);

	const isSubmitting = createAvailabilityMutation.isPending;

	const renderSelectionInput = (
		label: string,
		value: string,
		placeholder: string,
		onPress: () => void,
		icon: "time-outline" | "calendar-outline",
		options?: { flex?: number; onClear?: () => void },
	) => {
		const display = value?.trim() ? value : placeholder;
		return (
			<Box flex={options?.flex} gap="xs">
				<Text variant="caption" color="muted-foreground">
					{label}
				</Text>
				<Pressable
					onPress={onPress}
					disabled={isSubmitting}
					style={{
						borderRadius: theme.borderRadii.m,
						borderWidth: 1,
						borderColor: theme.colors.border,
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
							{display}
						</Text>
						<Ionicons
							name={icon}
							size={18}
							color={theme.colors["muted-foreground"]}
						/>
					</Box>
				</Pressable>
				{value && options?.onClear ? (
					<Pressable
						onPress={options.onClear}
						disabled={isSubmitting}
						style={{ marginTop: theme.spacing.xs }}
					>
						<Text variant="caption" color="muted-foreground">
							Clear
						</Text>
					</Pressable>
				) : null}
			</Box>
		);
	};

	const applyPickerValue = useCallback((field: PickerField, selected: Date) => {
		switch (field) {
			case "startTime":
				setStartTime(toTimeString(selected));
				break;
			case "endTime":
				setEndTime(toTimeString(selected));
				break;
			case "date":
				setDate(toDateString(selected));
				break;
			case "validFrom":
				setValidFrom(toDateString(selected));
				break;
			case "validUntil":
				setValidUntil(toDateString(selected));
				break;
			default:
				break;
		}
	}, []);

	const openTimePicker = useCallback(
		(field: "startTime" | "endTime") => {
			const currentValue =
				field === "startTime"
					? parseTimeString(startTime)
					: parseTimeString(endTime);
			setPickerState({ field, mode: "time", value: currentValue });
		},
		[endTime, startTime],
	);

	const openDatePicker = useCallback(
		(field: "date" | "validFrom" | "validUntil") => {
			const currentValue = parseDateString(
				field === "date"
					? date
					: field === "validFrom"
						? validFrom || undefined
						: validUntil || undefined,
			);
			setPickerState({ field, mode: "date", value: currentValue });
		},
		[date, validFrom, validUntil],
	);

	const handlePickerCancel = useCallback(() => {
		setPickerState(null);
	}, []);

	const handlePickerConfirm = useCallback(
		(selected: Date) => {
			if (!pickerState) return;
			applyPickerValue(pickerState.field, selected);
			setPickerState(null);
		},
		[applyPickerValue, pickerState],
	);

	const normalizeTime = (input: string): string => {
		const trimmed = input.trim();
		if (!trimmed) {
			throw new Error("Time is required.");
		}
		const parts = trimmed.split(":");
		if (parts.length === 2) {
			const [hours, minutes] = parts;
			const h = hours?.padStart(2, "0") ?? "0";
			const m = minutes?.padStart(2, "0") ?? "0";
			return `${h}:${m}:00`;
		}
		if (parts.length === 3) {
			const [hours, minutes, seconds] = parts;
			const h = hours?.padStart(2, "0") ?? "0";
			const m = minutes?.padStart(2, "0") ?? "0";
			const s = seconds?.padStart(2, "0") ?? "0";
			return `${h}:${m}:${s}`;
		}
		throw new Error("Time must be in HH:MM format.");
	};

	const isFormValid = useMemo(() => {
		if (isRecurring) {
			if (dayOfWeek == null) return false;
		} else if (!date.trim()) {
			return false;
		}
		if (!startTime.trim() || !endTime.trim()) return false;
		if (!timezone.trim()) return false;
		return true;
	}, [isRecurring, dayOfWeek, date, startTime, endTime, timezone]);

	const handleSubmit = useCallback(async () => {
		if (!cliqueId) {
			showToast({ type: "error", message: "Missing clique context." });
			return;
		}
		try {
			if (!timezone.trim()) {
				showToast({ type: "error", message: "Timezone is required." });
				return;
			}

			const normalizedStart = normalizeTime(startTime);
			const normalizedEnd = normalizeTime(endTime);

			const payload = {
				isRecurring,
				date: isRecurring ? null : date.trim() || null,
				dayOfWeek: isRecurring ? dayOfWeek : null,
				startTime: normalizedStart,
				endTime: normalizedEnd,
				validFrom: isRecurring ? validFrom.trim() || null : null,
				validUntil: isRecurring ? validUntil.trim() || null : null,
				timezone: timezone.trim(),
			};

			if (isRecurring && (payload.dayOfWeek == null || payload.dayOfWeek < 0)) {
				showToast({
					type: "error",
					message: "Select a day of the week for recurring availability.",
				});
				return;
			}

			if (!isRecurring && !payload.date) {
				showToast({
					type: "error",
					message: "Provide a date in YYYY-MM-DD format.",
				});
				return;
			}

			const result = (await createAvailabilityMutation.mutateAsync({
				params: {
					query: { cliqueId },
				},
				body: payload,
			})) as Availability;

			showToast({ type: "success", message: "Availability created" });
			onCreated?.(result);
			onClose();
		} catch (error: unknown) {
			showToast({
				type: "error",
				message: getErrorMessage(error, "Failed to create availability"),
			});
		}
	}, [
		cliqueId,
		createAvailabilityMutation,
		date,
		dayOfWeek,
		endTime,
		isRecurring,
		onClose,
		onCreated,
		startTime,
		timezone,
		validFrom,
		validUntil,
	]);

	const footer = (
		<Box flexDirection="row" justifyContent="flex-end" gap="s">
			<Button
				variant="primary"
				style={{ width: "100%" }}
				onPress={handleSubmit}
				disabled={!isFormValid || isSubmitting}
			>
				{isSubmitting ? "Creating..." : "Create Availability"}
			</Button>
		</Box>
	);

	return (
		<>
			<AppModal
				visible={visible}
				onClose={onClose}
				title="Create Availability"
				footer={footer}
			>
				<ScrollView
					contentContainerStyle={{ paddingBottom: theme.spacing.m }}
					keyboardShouldPersistTaps="handled"
				>
					<Box gap="m">
						<Box
							flexDirection="row"
							alignItems="center"
							justifyContent="space-between"
						>
							<Text variant="body" fontWeight="500">
								Recurring weekly
							</Text>
							<Switch
								value={isRecurring}
								onValueChange={setIsRecurring}
								disabled={isSubmitting}
							/>
						</Box>

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
										paddingVertical: theme.spacing.s / 2,
									}}
									columnWrapperStyle={{
										justifyContent: "space-between",
										marginBottom: theme.spacing.s,
									}}
									renderItem={({ item, index }) => {
										const isSelected = dayOfWeek === item.value;
										const isEndOfRow = (index + 1) % 3 === 0;
										return (
											<Pressable
												onPress={() => setDayOfWeek(item.value)}
												disabled={isSubmitting}
												style={{
													flex: 1,
													marginRight: isEndOfRow ? 0 : theme.spacing.s / 2,
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
							</Box>
						) : (
							renderSelectionInput(
								"Date (YYYY-MM-DD)",
								date,
								"Select date",
								() => openDatePicker("date"),
								"calendar-outline",
							)
						)}

						<Box flexDirection="row" gap="s">
							{renderSelectionInput(
								"Start time (HH:MM)",
								startTime,
								"09:00",
								() => openTimePicker("startTime"),
								"time-outline",
								{ flex: 1 },
							)}
							{renderSelectionInput(
								"End time (HH:MM)",
								endTime,
								"17:00",
								() => openTimePicker("endTime"),
								"time-outline",
								{ flex: 1 },
							)}
						</Box>

						{isRecurring ? (
							<Box flexDirection="row" gap="s">
								{renderSelectionInput(
									"Valid from (optional)",
									validFrom,
									"Select date",
									() => openDatePicker("validFrom"),
									"calendar-outline",
									{
										flex: 1,
										onClear: validFrom ? () => setValidFrom("") : undefined,
									},
								)}
								{renderSelectionInput(
									"Valid until (optional)",
									validUntil,
									"Select date",
									() => openDatePicker("validUntil"),
									"calendar-outline",
									{
										flex: 1,
										onClear: validUntil ? () => setValidUntil("") : undefined,
									},
								)}
							</Box>
						) : null}

						<Box>
							<Text
								variant="caption"
								color="muted-foreground"
								marginBottom="xs"
							>
								Timezone
							</Text>
							<Input
								value={timezone}
								onChangeText={setTimezone}
								autoCapitalize="none"
								placeholder="UTC"
								editable={!isSubmitting}
							/>
						</Box>
					</Box>
				</ScrollView>
			</AppModal>

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
