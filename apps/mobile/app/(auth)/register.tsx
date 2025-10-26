import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@shopify/restyle";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { Screen } from "@/components/screen";
import { FormField } from "@/components/ui/form-utils";
import { Input } from "@/components/ui/input";
import { KeyboardAvoidForm, ScrollForm } from "@/components/ui/keyboard-forms";
import { PasswordInput } from "@/components/ui/password-input";
import { Button, Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import { useRegisterMutation } from "@/hooks";
import { userCreateSchema } from "@/schemas/auth";
import { showToast } from "@/stores/toast-store";
import type { UserCreate } from "@/types/auth";

type RegisterForm = UserCreate;

export default function Register() {
	const registerMutation = useRegisterMutation();
	const { control, handleSubmit } = useForm<RegisterForm>({
		resolver: zodResolver(userCreateSchema),
	});
	const theme = useTheme<Theme>();

	const onSubmit = (data: RegisterForm) => {
		registerMutation.mutate(data, {
			onSuccess: () => {
				showToast({ type: "success", message: "Account created successfully" });
			},
			onError: (error: any) => {
				showToast({
					type: "error",
					message: `${error.message}${error.code ? ` (${error.code})` : ""}`,
				});
			},
		});
	};

	return (
		<Screen>
			<KeyboardAvoidForm>
				<ScrollForm>
					<Text variant="header" marginBottom="l">
						Register
					</Text>
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
					<Button
						onPress={handleSubmit(onSubmit)}
						disabled={registerMutation.isPending}
					>
						{registerMutation.isPending
							? "Creating account..."
							: "Create account"}
					</Button>
					<Link
						href="/(auth)/login"
						style={{
							marginTop: theme.spacing.l,
							color: theme.colors.primary,
							textAlign: "center",
						}}
					>
						Already have an account? Sign in
					</Link>
				</ScrollForm>
			</KeyboardAvoidForm>
		</Screen>
	);
}
