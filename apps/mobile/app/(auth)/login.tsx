import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@shopify/restyle";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { Screen } from "@/components/screen";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-utils";
import { Input } from "@/components/ui/input";
import { KeyboardAvoidForm, ScrollForm } from "@/components/ui/keyboard-forms";
import { PasswordInput } from "@/components/ui/password-input";
import { Text } from "@/components/ui/restyle-components";
import type { Theme } from "@/config/theme";
import { useLoginMutation } from "@/hooks";
import { loginRequestSchema } from "@/schemas/auth";
import { showToast } from "@/stores/toast-store";
import type { LoginRequest } from "@/types/auth";

type LoginForm = LoginRequest;

export default function Login() {
	const loginMutation = useLoginMutation();
	const { control, handleSubmit } = useForm<LoginForm>({
		resolver: zodResolver(loginRequestSchema),
	});
	const theme = useTheme<Theme>();

	const onSubmit = (data: LoginForm) => {
		loginMutation.mutate(data, {
			onSuccess: () => {
				showToast({ type: "success", message: "Logged in successfully" });
			},
			onError: (error: any) => {
				console.log(error);
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
						Login
					</Text>
					<FormField
						name="emailOrUsername"
						control={control}
						label="Email or Username"
						render={({ value, onChange, onBlur }) => (
							<Input
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								placeholder="email or username"
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
						disabled={loginMutation.isPending}
					>
						{loginMutation.isPending ? "Signing in..." : "Sign in"}
					</Button>
					<Link
						href="/(auth)/register"
						style={{
							color: theme.colors.primary,
							textAlign: "center",
						}}
					>
						Create account
					</Link>
				</ScrollForm>
			</KeyboardAvoidForm>
		</Screen>
	);
}
