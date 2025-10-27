import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useTheme } from "@shopify/restyle";
import { type } from "arktype";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-utils";
import { Input } from "@/components/ui/input";
import { KeyboardAvoidForm } from "@/components/ui/keyboard-avoid-forms";
import { OccupationSelect } from "@/components/ui/occupation-select";
import { PasswordInput } from "@/components/ui/password-input";
import { Box, Text } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import { Switch } from "@/components/ui/switch";
import type { Theme } from "@/config/theme";
import {
	useCreateOccupationMutation,
	useListOccupationsQuery,
	useRegisterMutation,
	useUpdateUserOccupationsMutation,
} from "@/hooks";
import { showToast } from "@/stores/toast-store";
import type { Occupation } from "@/types";

const schema = type({
	email: "string.email",
	username: "3 < string < 32",
	fullName: "string > 1",
	password: "string > 6",
	confirmPassword: "string",
	isBusinessPage: "boolean = false",
	occupations: "string[] | undefined",
}).narrow((data) => {
	if (data.password !== data.confirmPassword) {
		throw new Error("Passwords don't match");
	}
	if (
		data.isBusinessPage &&
		(!data.occupations || data.occupations.length === 0)
	) {
		throw new Error("Business pages must specify at least one occupation");
	}
	return true;
});

type RegisterForm = typeof schema.infer;

export default function Register() {
	const registerMutation = useRegisterMutation();
	const updateOccupationsMutation = useUpdateUserOccupationsMutation();
	const createOccupationMutation = useCreateOccupationMutation();
	const occupationsQuery = useListOccupationsQuery();
	const { control, handleSubmit, watch, setValue, getValues } =
		useForm<RegisterForm>({
			resolver: arktypeResolver(schema),
			defaultValues: {
				isBusinessPage: false,
			},
		});
	const theme = useTheme<Theme>();

	// Watch fullName to auto-fill username
	const fullName = watch("fullName");
	const username = watch("username");
	const isBusinessPage = watch("isBusinessPage");

	// Auto-fill username when fullName loses focus (only if username is empty or was auto-filled)
	// Also clear username if fullName is cleared
	const handleFullNameBlur = () => {
		const currentFullName = watch("fullName");
		if (currentFullName) {
			// Auto-fill username if it's empty or was previously auto-filled
			if (
				!username ||
				username === generateUsernameFromFullName(fullName || "")
			) {
				const generatedUsername = generateUsernameFromFullName(currentFullName);
				setValue("username", generatedUsername);
			}
		} else {
			// Clear username if fullName is cleared
			setValue("username", "");
		}
	};

	const generateUsernameFromFullName = (fullName: string): string => {
		return fullName
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "_")
			.slice(0, 32);
	};

	const onSubmit = (data: RegisterForm) => {
		const { confirmPassword: _, occupations, ...userData } = data;
		const registerData = {
			...userData,
			isAdmin: false,
			isActive: true,
			isPrivateAccount: false,
			isBusinessPage: userData.isBusinessPage || false,
		};
		registerMutation.mutate(
			{ body: registerData },
			{
				onSuccess: () => {
					// If business page and occupations specified, update occupations
					if (data.isBusinessPage && occupations && occupations.length > 0) {
						updateOccupationsMutation.mutate(
							{ body: occupations },
							{
								onSuccess: () => {
									showToast({
										type: "success",
										message: "Business account created successfully",
									});
								},
								onError: (error: any) => {
									showToast({
										type: "info",
										message:
											"Account created but failed to set occupations. You can set them later in your profile.",
									});
								},
							},
						);
					} else {
						showToast({
							type: "success",
							message: "Account created successfully",
						});
					}
				},
				onError: (error: any) => {
					showToast({
						type: "error",
						message: `${error.message}${error.code ? ` (${error.code})` : ""}`,
					});
				},
			},
		);
	};

	return (
		<Screen centerContent>
			<KeyboardAvoidForm style={{ width: "100%" }}>
				<Box padding="m" width="100%">
					<Text variant="header" marginBottom="l">
						Register
					</Text>
					<FormField
						name="fullName"
						control={control}
						label="Full Name"
						render={({ value, onChange, onBlur }) => (
							<Input
								value={value}
								onChangeText={onChange}
								onBlur={() => {
									onBlur();
									handleFullNameBlur();
								}}
								placeholder="full name"
								autoCapitalize="words"
							/>
						)}
					/>
					<FormField
						name="email"
						control={control}
						label="Email"
						render={({ value, onChange, onBlur }) => (
							<Input
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								placeholder="email"
								autoCapitalize="none"
								keyboardType="email-address"
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
								placeholder="username"
								autoCapitalize="none"
							/>
						)}
					/>
					<FormField
						name="password"
						control={control}
						label="Password"
						render={({ value, onChange, onBlur }) => (
							<PasswordInput
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								placeholder="password"
								autoCapitalize="none"
							/>
						)}
					/>
					<FormField
						name="confirmPassword"
						control={control}
						label="Confirm Password"
						render={({ value, onChange, onBlur }) => (
							<PasswordInput
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								placeholder="confirm password"
								autoCapitalize="none"
							/>
						)}
					/>

					<Box>
						<FormField
							name="isBusinessPage"
							control={control}
							render={({ value, onChange }) => (
								<Box
									flexDirection="row"
									alignItems="center"
									justifyContent="space-between"
								>
									<Text variant="body" color="foreground">
										This is a business page
									</Text>
									<Switch value={value} onValueChange={onChange} />
								</Box>
							)}
						/>
					</Box>

					{isBusinessPage && (
						<FormField
							name="occupations"
							control={control}
							label="Occupations"
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
												message:
													"Failed to create occupation. Please try again.",
											});
										}
									}}
								/>
							)}
						/>
					)}

					<Button
						onPress={handleSubmit(onSubmit)}
						disabled={registerMutation.isPending}
					>
						<Text>
							{registerMutation.isPending
								? "Creating account..."
								: "Create account"}
						</Text>
					</Button>
					<Link
						href="/(auth)/login"
						style={{
							color: theme.colors.primary,
							textAlign: "center",
							marginTop: theme.spacing.m,
						}}
					>
						Already have an account? Sign in
					</Link>
				</Box>
			</KeyboardAvoidForm>
		</Screen>
	);
}
