import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@shopify/restyle";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppModal } from "@/components/ui/modal";
import { Box, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import {
	usePresignUploadMutation,
	useRegisterUploadedMutation,
} from "@/hooks/use-media";
import { useCreatePostMutation } from "@/hooks/use-posts";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type { Post } from "@/types";
import { ContentFormat, PostStatus } from "@/types/generated";

type UploadState = "uploading" | "uploaded" | "error";

interface SelectedMedia {
	tempId: string;
	localUri: string;
	status: UploadState;
	mediaId?: string;
	remoteUrl?: string;
	mimeType: string;
}

interface CreatePostModalProps {
	visible: boolean;
	cliqueId: string;
	onClose: () => void;
	onCreated?: (post: Post) => void;
}

export function CreatePostModal({
	visible,
	cliqueId,
	onClose,
	onCreated,
}: CreatePostModalProps) {
	const theme = useTheme<Theme>();
	const [content, setContent] = useState("");
	const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);

	const createPostMutation = useCreatePostMutation();
	const presignMutation = usePresignUploadMutation();
	const registerMutation = useRegisterUploadedMutation();

	useEffect(() => {
		if (!visible) {
			setContent("");
			setSelectedMedia([]);
		}
	}, [visible]);

	const isUploading = useMemo(
		() => selectedMedia.some((item) => item.status === "uploading"),
		[selectedMedia],
	);

	const hasError = useMemo(
		() => selectedMedia.some((item) => item.status === "error"),
		[selectedMedia],
	);

	const uploadedMediaIds = useMemo(
		() =>
			selectedMedia
				.filter((item) => item.status === "uploaded" && item.mediaId)
				.map((item) => item.mediaId as string),
		[selectedMedia],
	);

	const handleRemoveMedia = useCallback((tempId: string) => {
		setSelectedMedia((prev) => prev.filter((item) => item.tempId !== tempId));
	}, []);

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
	}, [uploadAsset]);

	const handleSubmit = useCallback(async () => {
		if (!content.trim()) {
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

		try {
			const post = await createPostMutation.mutateAsync({
				params: {
					path: { cliqueId },
				},
				body: {
					content: content.trim(),
					contentFormat: ContentFormat.markdown,
					status: PostStatus.posted,
					mediaIds: uploadedMediaIds,
				},
			});
			showToast({ type: "success", message: "Post published" });
			onCreated?.(post);
			onClose();
		} catch (error: unknown) {
			showToast({
				type: "error",
				message: getErrorMessage(error, "Failed to publish post"),
			});
		}
	}, [
		content,
		createPostMutation,
		hasError,
		isUploading,
		cliqueId,
		onClose,
		onCreated,
		uploadedMediaIds,
	]);

	const footer = (
		<Box flexDirection="row" justifyContent="flex-end" gap="s">
			<Button
				variant="primary"
				style={{ width: "100%" }}
				onPress={handleSubmit}
				disabled={
					createPostMutation.isPending || !content.trim() || isUploading
				}
			>
				{createPostMutation.isPending ? "Posting..." : "Post"}
			</Button>
		</Box>
	);

	return (
		<AppModal
			visible={visible}
			onClose={onClose}
			title="Create Post"
			footer={footer}
		>
			<ScrollView
				style={{ maxHeight: 420 }}
				contentContainerStyle={{ paddingBottom: theme.spacing.m }}
				keyboardShouldPersistTaps="handled"
			>
				<Box gap="m">
					<Box>
						<Text variant="caption" color="muted-foreground" marginBottom="xs">
							Message
						</Text>
						<Input
							multiline
							numberOfLines={6}
							value={content}
							onChangeText={setContent}
							placeholder="Share something with your clique..."
							textAlignVertical="top"
							style={{
								minHeight: 140,
								paddingTop: theme.spacing.s,
							}}
							editable={!createPostMutation.isPending}
						/>
					</Box>
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
								disabled={isUploading || createPostMutation.isPending}
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
				</Box>
			</ScrollView>
		</AppModal>
	);
}
