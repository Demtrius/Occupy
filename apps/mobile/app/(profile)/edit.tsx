import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ScrollView, TextInput } from "react-native";
import { Screen } from "@/components/screen";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";
import { FormField } from "@/components/ui/form-utils";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Box, Text } from "@/components/ui/restyle-components";
import { Switch } from "@/components/ui/switch";
import { useMeQuery, useUpdateUserMutation } from "@/hooks/query";
import { type ProfileUpdateForm, profileUpdateSchema } from "@/schemas/profile";
import { showToast } from "@/stores/toast-store";

export default function EditProfilePage() {
	const router = useRouter();
	const userQuery = useMeQuery();
	const updateMutation = useUpdateUserMutation();

	const form = useForm<ProfileUpdateForm>({
		resolver: zodResolver(profileUpdateSchema),
		defaultValues: {
			fullName: "",
			username: "",
			bio: "",
			isPrivateAccount: false,
			profileImageUrl: "",
		},
	});

	const { control, handleSubmit, reset } = form;

	useEffect(() => {
		if (userQuery.data) {
			reset({
				fullName: userQuery.data.fullName || "",
				username: userQuery.data.username || "",
				bio: userQuery.data.bio || "",
				isPrivateAccount: userQuery.data.isPrivateAccount || false,
				profileImageUrl: userQuery.data.profileImageUrl || "",
			});
		}
	}, [userQuery.data, reset]);

	const onSubmit = (data: ProfileUpdateForm) => {
		updateMutation.mutate(data, {
			onSuccess: () => {
				showToast({ type: "success", message: "Profile updated successfully" });
				router.back();
			},
			onError: (error: any) => {
				showToast({
					type: "error",
					message: error.message || "Failed to update profile",
				});
			},
		});
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
					name="username"
					control={control}
					label="Username"
					render={({ value, onChange, onBlur }) => (
						<Input
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							placeholder="Enter your username"
						/>
					)}
				/>

				<FormField
					name="bio"
					control={control}
					label="Bio"
					render={({ value, onChange, onBlur }) => (
						<TextInput
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							placeholder="Tell us about yourself"
							multiline
							numberOfLines={4}
							style={{
								borderWidth: 1,
								borderColor: "#e4e4e7",
								borderRadius: 8,
								padding: 12,
								fontSize: 16,
								backgroundColor: "#ffffff",
								color: "#09090b",
								minHeight: 80,
							}}
						/>
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

				<Button
					onPress={handleSubmit(onSubmit)}
					disabled={updateMutation.isPending}
				>
					{updateMutation.isPending ? "Saving..." : "Save Changes"}
				</Button>
			</ScrollView>
		</Screen>
	);
}
