import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ScrollView } from "react-native";
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
	useUpdateUserMutation,
	useUpdateUserOccupationsMutation,
} from "@/hooks";
import { type UserProfileUpdateForm, userProfileUpdateSchema } from "@/schemas/users";
import { showToast } from "@/stores/toast-store";

export default function EditProfilePage() {
	const router = useRouter();
	const userQuery = useMeQuery();
	const updateMutation = useUpdateUserMutation();
	const updateOccupationsMutation = useUpdateUserOccupationsMutation();
	const createOccupationMutation = useCreateOccupationMutation();
	const occupationsQuery = useListOccupationsQuery();

	const form = useForm<UserProfileUpdateForm>({
		resolver: zodResolver(userProfileUpdateSchema),
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

	useEffect(() => {
		if (userQuery.data) {
			reset({
				fullName: userQuery.data.fullName || "",
				bio: userQuery.data.bio || "",
				isPrivateAccount: userQuery.data.isPrivateAccount || false,
				profileImageUrl: userQuery.data.profileImageUrl || "",
				isBusinessPage: userQuery.data.isBusinessPage || false,
				occupations: userQuery.data.occupations?.map((occ) => occ.id) || [],
			});
		}
	}, [userQuery.data, reset]);

	const onSubmit = async (data: UserProfileUpdateForm) => {
		try {
			// Update user profile (exclude isBusinessPage since it's not editable)
			const { isBusinessPage: _, ...updateData } = data;
			await updateMutation.mutateAsync(updateData);

			// Update occupations if user is a business page
			if (userQuery.data?.isBusinessPage && data.occupations) {
				await updateOccupationsMutation.mutateAsync(data.occupations);
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
					<Avatar
						size={100}
						source={
							userQuery.data?.profileImageUrl
								? { uri: userQuery.data.profileImageUrl }
								: undefined
						}
						fallback={userQuery.data?.username?.[0]?.toUpperCase()}
					/>
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
								occupations={occupationsQuery.data || []}
								loading={occupationsQuery.isLoading}
								placeholder="Select your business occupations..."
								onCreateOccupation={async (name) => {
									try {
										const newOccupation =
											await createOccupationMutation.mutateAsync(name);
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
