import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useTheme } from "@shopify/restyle";
import { type } from "arktype";
import { Link } from "expo-router";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-utils";
import { Input } from "@/components/ui/input";
import { KeyboardAvoidForm } from "@/components/ui/keyboard-avoid-forms";
import { PasswordInput } from "@/components/ui/password-input";
import { Box, Text } from "@/components/ui/restyle-components";
import { Screen } from "@/components/ui/screen";
import type { Theme } from "@/config/theme";
import { useLoginMutation } from "@/hooks";
import { showToast } from "@/stores/toast-store";

const schema = type({
	emailOrUsername: "string.email|string > 0",
	password: "string > 0",
});

type LoginForm = typeof schema.infer;

export default function Login() {
	const loginMutation = useLoginMutation();
	const { control, handleSubmit } = useForm<LoginForm>({
		resolver: arktypeResolver(schema),
	});

	const theme = useTheme<Theme>();

	const onSubmit = (data: LoginForm) => {
		loginMutation.mutate(
			{ body: data },
			{
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
			},
		);
	};

	return (
		<Screen centerContent>
			<KeyboardAvoidForm style={{ width: "100%" }}>
				<Box padding="m" width="100%">
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
							marginTop: theme.spacing.m,
						}}
					>
						Create account
					</Link>
				</Box>
			</KeyboardAvoidForm>
		</Screen>
	);
}
