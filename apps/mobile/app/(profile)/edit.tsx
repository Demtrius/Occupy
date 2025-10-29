import { arktypeResolver } from "@hookform/resolvers/arktype";
import { type } from "arktype";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, ScrollView } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { FormField } from "@/components/ui/form-utils";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { OccupationSelect } from "@/components/ui/occupation-select";
import { Box, Text } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { Switch } from "@/components/ui/switch";
import {
	useCreateOccupationMutation,
	useListOccupationsQuery,
	useMeQuery,
	usePresignUploadMutation,
	useRegisterUploadedMutation,
	useUpdateUserMutation,
	useUpdateUserOccupationsMutation,
} from "@/hooks";
import { showToast } from "@/stores/toast-store";
import type { Occupation } from "@/types";

const schema = type({
	fullName: "string | null",
	bio: "string | null",
	profileImageUrl: "string | null",
	isPrivateAccount: "boolean",
	isBusinessPage: "boolean",
	occupations: "string[]",
});

type UserProfileUpdateForm = typeof schema.infer;

export default function EditProfilePage() {
	const router = useRouter();
	const userQuery = useMeQuery();
	const updateMutation = useUpdateUserMutation();
	const updateOccupationsMutation = useUpdateUserOccupationsMutation();
	const createOccupationMutation = useCreateOccupationMutation();
	const occupationsQuery = useListOccupationsQuery();
	const presignMutation = usePresignUploadMutation();
	const registerMutation = useRegisterUploadedMutation();
	const [selectedImage, setSelectedImage] = useState<string | null>(null);

	const form = useForm<UserProfileUpdateForm>({
		resolver: arktypeResolver(schema),
		defaultValues: {
			fullName: "",
			bio: "",
			isPrivateAccount: false,
			isBusinessPage: false,
			profileImageUrl: "",
			occupations: [],
		},
	});

	const { control, handleSubmit, reset, watch, setValue, getValues } = form;
	const isBusinessPage = watch("isBusinessPage");

	const pickImage = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			showToast({
				type: "error",
				message: "Permission to access media library is required",
			});
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});

		if (!result.canceled && result.assets[0]) {
			setSelectedImage(result.assets[0].uri);
		}
	};

	const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileType = blob.type || "image/jpeg";

      const presignData = await presignMutation.mutateAsync({
        params: {
          query: {
            mime: fileType,
            sizeBytes: blob.size,
            purpose: "profile",
          },
        },
      });

      const { uploadUrl, publicUrl, method } = presignData;

			if (!uploadUrl) {
				showToast({
					type: "error",
					message: "Failed to upload image",
				});
				return null;
			}

			await fetch(uploadUrl, {
				method,
				body: blob,
				headers: {
					"Content-Type": fileType,
				},
			});

			const finalUrl = publicUrl ?? uploadUrl.split("?")[0];

			if (!finalUrl) {
				showToast({
					type: "error",
					message: "Failed to upload image",
				});
				return null;
			}

			await registerMutation.mutateAsync({
				body: {
					url: finalUrl,
					mime: fileType,
					sizeBytes: blob.size,
				},
			});

			return finalUrl;
		} catch (error: any) {
			showToast({
				type: "error",
				message: error.message || "Failed to upload image",
			});
			return null;
		}
	};

	useEffect(() => {
		if (userQuery.data) {
			reset({
				fullName: userQuery.data.fullName,
				bio: userQuery.data.bio,
				isPrivateAccount: userQuery.data.isPrivateAccount,
				profileImageUrl: userQuery.data.profileImageUrl,
				isBusinessPage: userQuery.data.isBusinessPage,
				occupations: [],
			});
		}
	}, [userQuery.data, reset]);

	const onSubmit = async (data: UserProfileUpdateForm) => {
		try {
			let profileImageUrl = data.profileImageUrl;

			// Upload new image if selected
			if (selectedImage) {
				const uploadedUrl = await uploadImage(selectedImage);
				if (uploadedUrl) {
					profileImageUrl = uploadedUrl;
				} else {
					return; // Don't proceed if upload failed
				}
			}

			// Update user profile (exclude isBusinessPage since it's not editable)
			const { isBusinessPage: _, ...updateData } = { ...data, profileImageUrl };
			await updateMutation.mutateAsync({ body: updateData });

			// Update occupations if user is a business page
			if (userQuery.data?.isBusinessPage && data.occupations) {
				await updateOccupationsMutation.mutateAsync({ body: data.occupations });
			}

			showToast({ type: "success", message: "Profile updated successfully" });
			router.back();
		} catch (error: any) {
			showToast({
				type: "error",
				message: error.message || "Failed to update profile",
			});
		}
	};

	if (userQuery.isLoading) {
		return <LoadingScreen />;
	}

	if (userQuery.error) {
		return (
			<ErrorScreen
				message="Failed to load profile"
				onRetry={() => userQuery.refetch()}
			/>
		);
	}

	return (
		<Screen>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ padding: 16 }}
			>
				<Box alignItems="center" marginBottom="l">
					<Pressable onPress={pickImage}>
						<Avatar
							size={100}
							source={
								selectedImage
									? { uri: selectedImage }
									: userQuery.data?.profileImageUrl
										? { uri: userQuery.data.profileImageUrl }
										: undefined
							}
							fallback={userQuery.data?.username?.[0]?.toUpperCase()}
						/>
					</Pressable>
					<Text variant="caption" color="muted-foreground" marginTop="s">
						Tap to change profile picture
					</Text>
				</Box>

				<FormField
					name="fullName"
					control={control}
					label="Full Name"
					render={({ value, onChange, onBlur }) => (
						<Input
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							placeholder="Enter your full name"
						/>
					)}
				/>

				<FormField
					name="bio"
					control={control}
					label="Bio"
					render={({ value, onChange, onBlur }) => (
						<Input
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							placeholder="Tell us about yourself"
							multiline
							numberOfLines={4}
						/>
					)}
				/>

				<FormField
					name="isBusinessPage"
					control={control}
					render={({ value }) => (
						<Box
							flexDirection="row"
							alignItems="center"
							justifyContent="space-between"
						>
							<Text variant="body">
								{value ? "Business Page" : "Personal Account"}
							</Text>
							<Switch value={value} onValueChange={() => {}} disabled />
						</Box>
					)}
				/>

				<FormField
					name="isPrivateAccount"
					control={control}
					label="Private Account"
					render={({ value, onChange }) => (
						<Box
							flexDirection="row"
							alignItems="center"
							justifyContent="space-between"
						>
							<Text variant="body">Make account private</Text>
							<Switch value={value} onValueChange={onChange} />
						</Box>
					)}
				/>

				{isBusinessPage && (
					<FormField
						name="occupations"
						control={control}
						label="Business Occupations"
						render={({ value, onChange }) => (
							<OccupationSelect
								value={value || []}
								onChange={onChange}
								occupations={(occupationsQuery.data || []) as Occupation[]}
								loading={occupationsQuery.isLoading}
								placeholder="Select your business occupations..."
								onCreateOccupation={async (name) => {
									try {
										const newOccupation =
											await createOccupationMutation.mutateAsync({
												body: { name },
											});
										if (newOccupation) {
											// Add the new occupation to the selected occupations
											const currentValue = getValues("occupations") || [];
											setValue("occupations", [
												...currentValue,
												newOccupation.id,
											]);
											showToast({
												type: "success",
												message: `Created and selected "${newOccupation.name}"`,
											});
										}
									} catch (error) {
										showToast({
											type: "error",
											message: "Failed to create occupation. Please try again.",
										});
									}
								}}
							/>
						)}
					/>
				)}

				{/* Spacer to push button to bottom */}
				<Box flex={1} minHeight={50} />
			</ScrollView>

			{/* Fixed button at bottom */}
			<Box padding="m" backgroundColor="background" marginBottom="xl">
				<Button
					onPress={handleSubmit(onSubmit)}
					disabled={
						updateMutation.isPending || updateOccupationsMutation.isPending
					}
				>
					{updateMutation.isPending || updateOccupationsMutation.isPending
						? "Saving..."
						: "Save Changes"}
				</Button>
			</Box>
		</Screen>
	);
}
