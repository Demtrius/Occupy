import { Ionicons } from "@expo/vector-icons";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useTheme } from "@shopify/restyle";
import { type } from "arktype";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-utils";
import { Input } from "@/components/ui/input";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import {
	usePresignUploadMutation,
	useRegisterUploadedMutation,
} from "@/hooks/use-media";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";

export type UploadState = "uploading" | "uploaded" | "error";

export interface SelectedMedia {
	tempId: string;
	localUri?: string;
	status: UploadState;
	mediaId?: string;
	remoteUrl?: string;
	mimeType: string;
	width?: number | null;
	height?: number | null;
	fileName?: string | null;
}

const schema = type({
	content: "string > 0",
});

type PostFormValues = typeof schema.infer;

export interface PostFormSubmitPayload {
	content: string;
	mediaIds: string[];
}

export interface PostFormProps {
	initialContent?: string;
	initialMedia?: SelectedMedia[];
	onSubmit: (payload: PostFormSubmitPayload) => Promise<void> | void;
	isSubmitting?: boolean;
	submitLabel?: string;
	allowMediaEditing?: boolean;
}

export function PostForm({
	initialContent = "",
	initialMedia,
	onSubmit,
	isSubmitting = false,
	submitLabel = "Post",
	allowMediaEditing = true,
}: PostFormProps) {
	const theme = useTheme<Theme>();
	const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>(
		initialMedia ?? [],
	);

	const {
		control,
		handleSubmit,
		reset,
		formState: { isValid },
	} = useForm<PostFormValues>({
		resolver: arktypeResolver(schema),
		mode: "onChange",
		defaultValues: {
			content: initialContent,
		},
	});

	useEffect(() => {
		reset({ content: initialContent });
	}, [initialContent, reset]);

	useEffect(() => {
		setSelectedMedia(initialMedia ?? []);
	}, [initialMedia]);

	const presignMutation = usePresignUploadMutation();
	const registerMutation = useRegisterUploadedMutation();

	const isUploading = useMemo(
		() => selectedMedia.some((item) => item.status === "uploading"),
		[selectedMedia],
	);

	const hasError = useMemo(
		() => selectedMedia.some((item) => item.status === "error"),
		[selectedMedia],
	);

	const handleRemoveMedia = useCallback(
		(tempId: string) => {
			if (!allowMediaEditing) return;
			setSelectedMedia((prev) => prev.filter((item) => item.tempId !== tempId));
		},
		[allowMediaEditing],
	);

	const uploadAsset = useCallback(
		async (asset: ImagePicker.ImagePickerAsset) => {
			const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			const initialMime =
				asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg");

			setSelectedMedia((prev) => [
				...prev,
				{
					tempId,
					localUri: asset.uri,
					status: "uploading",
					mimeType: initialMime,
					width: asset.width,
					height: asset.height,
					fileName: asset.fileName,
				},
			]);

			try {
				const response = await fetch(asset.uri);
				const blob = await response.blob();
				const mimeType = asset.mimeType ?? blob.type ?? "image/jpeg";
				const sizeBytes = blob.size;

				const presign = await presignMutation.mutateAsync({
					params: {
						query: {
							mime: mimeType,
							sizeBytes,
							purpose: "post-media",
						},
					},
				});

				const uploadResponse = await fetch(presign.uploadUrl, {
					method: "PUT",
					headers: {
						"Content-Type": mimeType,
					},
					body: blob,
				});

				if (!uploadResponse.ok) {
					throw new Error("Failed to upload media");
				}

				const register = await registerMutation.mutateAsync({
					body: {
						url: presign.publicUrl,
						mime: mimeType,
						sizeBytes,
						meta: {
							width: asset.width,
							height: asset.height,
							fileName: asset.fileName,
						},
					},
				});

				setSelectedMedia((prev) =>
					prev.map((item) =>
						item.tempId === tempId
							? {
									...item,
									status: "uploaded",
									mediaId: register.mediaId,
									remoteUrl: presign.publicUrl,
									mimeType,
								}
							: item,
					),
				);
			} catch (error: unknown) {
				setSelectedMedia((prev) =>
					prev.map((item) =>
						item.tempId === tempId ? { ...item, status: "error" } : item,
					),
				);
				showToast({
					type: "error",
					message: getErrorMessage(error, "Failed to upload image"),
				});
			}
		},
		[presignMutation, registerMutation],
	);

	const handlePickImages = useCallback(async () => {
		try {
			if (!allowMediaEditing) return;
			const permission =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (!permission.granted) {
				Alert.alert(
					"Permission Required",
					"Please enable photo library access to upload images.",
				);
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsMultipleSelection: true,
				quality: 0.8,
			});

			if (result.canceled || !result.assets) {
				return;
			}

			await Promise.all(result.assets.map((asset) => uploadAsset(asset)));
		} catch (error: unknown) {
			showToast({
				type: "error",
				message: getErrorMessage(error, "Unable to pick images"),
			});
		}
	}, [allowMediaEditing, uploadAsset]);

	const existingMediaIds = useMemo(
		() =>
			selectedMedia
				.filter((item) => item.status === "uploaded" && item.mediaId)
				.map((item) => item.mediaId as string),
		[selectedMedia],
	);

	const handleFormSubmit = useCallback(
		async (values: PostFormValues) => {
			if (!values.content.trim()) {
				showToast({ type: "error", message: "Post content cannot be empty." });
				return;
			}
			if (isUploading) {
				showToast({
					type: "info",
					message: "Please wait for uploads to finish before posting.",
				});
				return;
			}
			if (hasError) {
				showToast({
					type: "error",
					message: "Remove failed uploads or retry before posting.",
				});
				return;
			}

			await onSubmit({
				content: values.content.trim(),
				mediaIds: existingMediaIds,
			});
		},
		[existingMediaIds, hasError, isUploading, onSubmit],
	);

	return (
		<ScrollView
			style={{ maxHeight: 420 }}
			contentContainerStyle={{ paddingBottom: theme.spacing.m }}
			keyboardShouldPersistTaps="handled"
		>
			<Box gap="m">
				<FormField
					name="content"
					control={control}
					label="Message"
					render={({ value, onChange, onBlur, error }) => (
						<Input
							multiline
							numberOfLines={6}
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							placeholder="Share something with your clique..."
							textAlignVertical="top"
							style={{
								minHeight: 140,
								paddingTop: theme.spacing.s,
							}}
							editable={!isSubmitting}
						/>
					)}
				/>

				<Box gap="s">
					<Box
						flexDirection="row"
						alignItems="center"
						justifyContent="space-between"
					>
						<Text variant="caption" color="muted-foreground">
							Photos
						</Text>
						<Button
							variant="secondary"
							style={{
								backgroundColor: theme.colors.ring,
							}}
							textProps={{ color: "secondary" }}
							onPress={handlePickImages}
							disabled={isUploading || isSubmitting || !allowMediaEditing}
						>
							Add Photos
						</Button>
					</Box>
					{selectedMedia.length > 0 ? (
						<Box flexDirection="row" flexWrap="wrap">
							{selectedMedia.map((item) => (
								<Box
									key={item.tempId}
									width={96}
									height={96}
									borderRadius="m"
									overflow="hidden"
									position="relative"
									backgroundColor="muted"
									style={{
										marginRight: theme.spacing.s,
										marginBottom: theme.spacing.s,
									}}
								>
									<Image
										source={{
											uri: item.remoteUrl ?? item.localUri,
										}}
										style={{ width: "100%", height: "100%" }}
										contentFit="cover"
									/>
									{allowMediaEditing ? (
										<Pressable
											onPress={() => handleRemoveMedia(item.tempId)}
											style={{
												position: "absolute",
												top: theme.spacing.xs,
												right: theme.spacing.xs,
												backgroundColor: "rgba(0,0,0,0.55)",
												borderRadius: theme.borderRadii.s,
												padding: 4,
											}}
										>
											<Ionicons
												name="close"
												size={14}
												color={theme.colors["primary-foreground"]}
											/>
										</Pressable>
									) : null}
									{item.status === "uploading" ? (
										<View
											style={{
												position: "absolute",
												top: 0,
												bottom: 0,
												left: 0,
												right: 0,
												backgroundColor: "rgba(0,0,0,0.35)",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<ActivityIndicator color="#ffffff" />
										</View>
									) : null}
									{item.status === "error" ? (
										<View
											style={{
												position: "absolute",
												top: 0,
												bottom: 0,
												left: 0,
												right: 0,
												backgroundColor: "rgba(0,0,0,0.55)",
												alignItems: "center",
												justifyContent: "center",
												paddingHorizontal: theme.spacing.s,
											}}
										>
											<Text
												variant="caption"
												color="primary-foreground"
												textAlign="center"
											>
												Upload failed
											</Text>
										</View>
									) : null}
								</Box>
							))}
						</Box>
					) : (
						<Text variant="caption" color="muted-foreground">
							No photos added yet.
						</Text>
					)}
				</Box>

				<Button
					variant="primary"
					onPress={handleSubmit(handleFormSubmit)}
					disabled={isSubmitting || !isValid || isUploading}
				>
					{isSubmitting ? "Saving..." : submitLabel}
				</Button>
			</Box>
		</ScrollView>
	);
}
