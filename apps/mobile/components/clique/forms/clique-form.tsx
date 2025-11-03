import { Ionicons } from "@expo/vector-icons";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useTheme } from "@shopify/restyle";
import { type } from "arktype";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-utils";
import { Input } from "@/components/ui/input";
import { OccupationSelect } from "@/components/ui/occupation-select";
import { Box, Text } from "@/components/ui/restyle-components";
import { Switch } from "@/components/ui/switch";
import type { Theme } from "@/config/theme";
import type { Occupation } from "@/types";
import { Privacy } from "@/types/generated";
import {
	usePresignUploadMutation,
	useRegisterUploadedMutation,
} from "@/hooks/use-media";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";

const schema = type({
	name: "string > 0",
	description: "string | null | undefined",
	imageUrl: "string | null | undefined",
	privacy: "'public' | 'private'",
	timezone: "string > 0",
	cancellationCutoffHours: "string > 0",
	occupationIds: "string[]",
});

export type CliqueFormValues = typeof schema.infer;

export interface CliqueFormSubmitPayload {
	name: string;
	description: string | null;
	imageUrl: string | null;
	privacy: Privacy;
	timezone: string;
	cancellationCutoffHours: number;
	occupationIds: string[];
}

interface CliqueFormInitialValues {
	name?: string | null;
	description?: string | null;
	imageUrl?: string | null;
	privacy?: Privacy | null;
	timezone?: string | null;
	cancellationCutoffHours?: number | string | null;
	occupationIds?: string[] | null;
}

interface CliqueFormProps {
	initialValues?: CliqueFormInitialValues;
	onSubmit: (values: CliqueFormSubmitPayload) => Promise<void> | void;
	isSubmitting?: boolean;
	submitLabel?: string;
	occupations: Occupation[];
	occupationsLoading?: boolean;
	onCreateOccupation?: (name: string) => Promise<Occupation | null>;
}

const DEFAULT_VALUES: CliqueFormValues = {
	name: "",
	description: "",
	imageUrl: "",
	privacy: "public",
	timezone: "UTC",
	cancellationCutoffHours: "24",
	occupationIds: [],
};

function normalizeCutoff(input: string): string {
	if (!input.trim()) {
		return "0";
	}
	return input.replace(/[^0-9]/g, "") || "0";
}

export function CliqueForm({
	initialValues,
	onSubmit,
	isSubmitting = false,
	submitLabel = "Create Clique",
	occupations,
	occupationsLoading = false,
	onCreateOccupation,
}: CliqueFormProps) {
	const theme = useTheme<Theme>();

	const {
		control,
		handleSubmit,
		formState,
		reset,
		getValues,
		setValue,
		watch,
		register,
	} = useForm<CliqueFormValues>({
		resolver: arktypeResolver(schema),
		mode: "onChange",
		defaultValues: DEFAULT_VALUES,
	});

	const [localImageUri, setLocalImageUri] = useState<string | null>(null);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const presignMutation = usePresignUploadMutation();
	const registerMutation = useRegisterUploadedMutation();
	const imageUrlValue = watch("imageUrl");
	const displayImageUri =
		localImageUri ??
		(imageUrlValue && imageUrlValue.trim() ? imageUrlValue.trim() : null);
	const isBusy = isSubmitting || isUploadingImage;

	useEffect(() => {
		register("imageUrl");
	}, [register]);

	useEffect(() => {
		const merged: CliqueFormValues = {
			...DEFAULT_VALUES,
			...initialValues,
			name: initialValues?.name ?? DEFAULT_VALUES.name,
			description:
				initialValues?.description != null
					? (initialValues.description ?? "")
					: DEFAULT_VALUES.description,
			imageUrl:
				initialValues?.imageUrl != null
					? (initialValues.imageUrl ?? "")
					: DEFAULT_VALUES.imageUrl,
			privacy:
				(initialValues?.privacy as Privacy | undefined) ??
				(DEFAULT_VALUES.privacy as Privacy),
			timezone:
				initialValues?.timezone && initialValues.timezone.trim().length > 0
					? initialValues.timezone
					: DEFAULT_VALUES.timezone,
			cancellationCutoffHours: initialValues?.cancellationCutoffHours
				? String(initialValues.cancellationCutoffHours)
				: DEFAULT_VALUES.cancellationCutoffHours,
			occupationIds: initialValues?.occupationIds
				? [...initialValues.occupationIds]
				: DEFAULT_VALUES.occupationIds,
		};

		if (!merged.cancellationCutoffHours.trim()) {
			merged.cancellationCutoffHours = DEFAULT_VALUES.cancellationCutoffHours;
		}

		reset(merged);
		setLocalImageUri(null);
	}, [initialValues, reset]);

	const pickImage = useCallback(async () => {
		if (isBusy) return;

		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			showToast({
				type: "error",
				message: "Permission to access media library is required",
			});
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			quality: 0.85,
			aspect: [1, 1],
		});

		if (!result.canceled && result.assets[0]) {
			setLocalImageUri(result.assets[0].uri);
			setValue("imageUrl", "", {
				shouldDirty: true,
				shouldValidate: true,
			});
		}
	}, [isBusy, setValue]);

	const handleRemoveImage = useCallback(() => {
		if (isBusy) return;
		setLocalImageUri(null);
		setValue("imageUrl", "", {
			shouldDirty: true,
			shouldValidate: true,
		});
	}, [isBusy, setValue]);

	const handleFormSubmit = useCallback(
		async (values: CliqueFormValues) => {
			const trimmedName = values.name.trim();
			const trimmedTimezone = values.timezone.trim();
			const cutoffRaw = normalizeCutoff(values.cancellationCutoffHours);
			const cutoff = Number.parseInt(cutoffRaw, 10);
			let finalImageUrl = values.imageUrl?.trim()
				? values.imageUrl.trim()
				: null;

			if (localImageUri) {
				setIsUploadingImage(true);
				try {
					const response = await fetch(localImageUri);
					const blob = await response.blob();
					const mimeType = blob.type || "image/jpeg";

					const presign = await presignMutation.mutateAsync({
						params: {
							query: {
								mime: mimeType,
								sizeBytes: blob.size,
								purpose: "clique",
							},
						},
					});

					const { uploadUrl, publicUrl, method } = presign;
					if (!uploadUrl) {
						throw new Error("Missing upload URL");
					}

					await fetch(uploadUrl, {
						method: method ?? "PUT",
						body: blob,
						headers: {
							"Content-Type": mimeType,
						},
					});

					const uploadedUrl = publicUrl ?? uploadUrl.split("?")[0];
					if (!uploadedUrl) {
						throw new Error("Failed to resolve uploaded image URL");
					}

					await registerMutation.mutateAsync({
						body: {
							url: uploadedUrl,
							mime: mimeType,
							sizeBytes: blob.size,
						},
					});

					finalImageUrl = uploadedUrl;
					setValue("imageUrl", uploadedUrl, {
						shouldDirty: true,
						shouldValidate: true,
					});
					setLocalImageUri(null);
				} catch (error: unknown) {
					showToast({
						type: "error",
						message: getErrorMessage(error, "Failed to upload image"),
					});
					setIsUploadingImage(false);
					return;
				} finally {
					setIsUploadingImage(false);
				}
			}

			const payload: CliqueFormSubmitPayload = {
				name: trimmedName,
				description: values.description?.trim()
					? values.description.trim()
					: null,
				imageUrl: finalImageUrl,
				privacy: (values.privacy as Privacy) ?? Privacy.public,
				timezone: trimmedTimezone,
				cancellationCutoffHours: Number.isNaN(cutoff) ? 0 : cutoff,
				occupationIds: values.occupationIds ?? [],
			};

			await onSubmit(payload);
		},
		[localImageUri, onSubmit, presignMutation, registerMutation, setValue],
	);

	const computedSubmitLabel = isUploadingImage
		? "Uploading..."
		: isSubmitting
			? "Saving..."
			: submitLabel;

	return (
		<ScrollView
			contentContainerStyle={{ paddingBottom: theme.spacing.m }}
			keyboardShouldPersistTaps="handled"
		>
			<Box>
				<Box alignItems="center" marginBottom="m" gap="s">
					<Pressable onPress={pickImage} disabled={isBusy}>
						<Box
							width={96}
							height={96}
							borderRadius="l"
							overflow="hidden"
							backgroundColor="muted"
							alignItems="center"
							justifyContent="center"
						>
							{displayImageUri ? (
								<Image
									source={{ uri: displayImageUri }}
									style={{ width: "100%", height: "100%" }}
									contentFit="cover"
								/>
							) : (
								<Box alignItems="center" justifyContent="center" gap="s">
									<Ionicons
										name="camera-outline"
										size={20}
										color={theme.colors["muted-foreground"]}
									/>
								</Box>
							)}
							{isUploadingImage ? (
								<Box
									position="absolute"
									top={0}
									right={0}
									bottom={0}
									left={0}
									alignItems="center"
									justifyContent="center"
									style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
								>
									<ActivityIndicator color="#ffffff" />
								</Box>
							) : null}
						</Box>
					</Pressable>
					<Text variant="caption" color="muted-foreground">
						Tap to {displayImageUri ? "change" : "upload"} clique image
					</Text>
					{displayImageUri ? (
						<Button
							variant="ghost"
							onPress={handleRemoveImage}
							disabled={isBusy}
						>
							Remove image
						</Button>
					) : null}
				</Box>

				<FormField
					name="name"
					control={control}
					label="Clique name"
					render={({ value, onChange, onBlur }) => (
						<Input
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							placeholder="e.g. Morning Runners"
							editable={!isBusy}
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
							placeholder="Tell people what this clique is about..."
							multiline
							numberOfLines={4}
							textAlignVertical="top"
							style={{
								minHeight: 120,
								paddingTop: theme.spacing.s,
							}}
							editable={!isBusy}
						/>
					)}
				/>

				<FormField
					name="privacy"
					control={control}
					render={({ value, onChange }) => (
						<Box
							flexDirection="row"
							alignItems="center"
							justifyContent="space-between"
						>
							<Text variant="body" fontWeight="500">
								Private clique
							</Text>
							<Switch
								value={value === Privacy.private}
								onValueChange={(checked) =>
									onChange(checked ? Privacy.private : Privacy.public)
								}
								disabled={isBusy}
							/>
						</Box>
					)}
				/>

				<FormField
					name="timezone"
					control={control}
					label="Timezone"
					render={({ value, onChange, onBlur }) => (
						<Input
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							placeholder="e.g. America/New_York"
							autoCapitalize="none"
							autoCorrect={false}
							editable={!isBusy}
						/>
					)}
				/>

				<FormField
					name="cancellationCutoffHours"
					control={control}
					label="Cancellation cutoff (hours)"
					render={({ value, onChange, onBlur }) => (
						<Input
							value={value}
							onChangeText={(text) => onChange(normalizeCutoff(text))}
							onBlur={onBlur}
							keyboardType="number-pad"
							editable={!isBusy}
						/>
					)}
				/>

				<FormField
					name="occupationIds"
					control={control}
					label="Occupations"
					render={({ value, onChange }) => (
						<OccupationSelect
							value={value ?? []}
							onChange={onChange}
							occupations={occupations as Occupation[]}
							loading={occupationsLoading}
							placeholder="Select relevant occupations..."
							onCreateOccupation={
								onCreateOccupation
									? async (name) => {
											const created = await onCreateOccupation(name);
											if (created) {
												const current = getValues("occupationIds") ?? [];
												if (!current.includes(created.id)) {
													setValue("occupationIds", [...current, created.id], {
														shouldDirty: true,
														shouldValidate: true,
													});
												}
											}
										}
									: undefined
							}
						/>
					)}
				/>

				<Button
					variant="primary"
					onPress={handleSubmit(handleFormSubmit)}
					disabled={!formState.isValid || isBusy}
				>
					{computedSubmitLabel}
				</Button>
			</Box>
		</ScrollView>
	);
}
