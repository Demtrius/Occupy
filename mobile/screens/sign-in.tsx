import React, { useState } from "react";
import {
	View,
	StyleSheet,
	Text,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Image,
	Dimensions,
} from "react-native";
import { useAuthStore } from "../store/auth.store";
import { showError, showSuccess } from "../store/app.store";
import { LoginCredentials, ScreenNavigationProp } from "../types";
import {
	FormSection,
	FormLabel,
	FormInput,
	PrimaryButton,
	InfoBox,
} from "../components";
import { Colors, Spacing, Typography, BorderRadius } from "../theme";

const { width } = Dimensions.get("window");

interface SignInProps {
	navigation: ScreenNavigationProp<"SignIn">;
}

interface FormErrors {
	email?: string;
	password?: string;
}

const SignInScreen: React.FC<SignInProps> = ({ navigation }) => {
	const login = useAuthStore((state) => state.login);
	const isLoading = useAuthStore((state) => state.isLoading);
	const error = useAuthStore((state) => state.error);
	const clearError = useAuthStore((state) => state.clearError);

	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [securePassword, setSecurePassword] = useState<boolean>(true);
	const [formErrors, setFormErrors] = useState<FormErrors>({});

	// Validate form
	const validateForm = (): boolean => {
		const errors: FormErrors = {};

		// Email validation
		if (!email.trim()) {
			errors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			errors.email = "Email is invalid";
		}

		// Password validation
		if (!password.trim()) {
			errors.password = "Password is required";
		} else if (password.length < 6) {
			errors.password = "Password must be at least 6 characters";
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// Handle login
	const handleLogin = async () => {
		// Clear previous errors
		clearError();
		setFormErrors({});

		// Validate form
		if (!validateForm()) {
			return;
		}

		try {
			const credentials: LoginCredentials = {
				email: email.trim().toLowerCase(),
				password,
			};

			await login(credentials);
			showSuccess("Login successful!");
		} catch (err: any) {
			console.error("Login error:", err);
			const errorMessage =
				err.message || "Login failed. Please check your credentials.";
			showError(errorMessage);
		}
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.content}>
					{/* Logo */}
					<Image
						source={require("../assets/occupyLogo.png")}
						style={styles.logo}
					/>

					{/* Title */}
					<Text style={styles.title}>Welcome Back!</Text>

					{/* Display global error */}
					{error && (
						<InfoBox variant="error" style={styles.errorBox}>
							{error}
						</InfoBox>
					)}

					{/* Email Input */}
					<View style={styles.inputGroup}>
						<FormLabel>Email</FormLabel>
						<FormInput
							value={email}
							onChangeText={(text) => {
								setEmail(text);
								if (formErrors.email) {
									setFormErrors({ ...formErrors, email: undefined });
								}
							}}
							placeholder="Enter your email"
							autoCapitalize="none"
							keyboardType="email-address"
							textContentType="emailAddress"
							editable={!isLoading}
						/>
						{formErrors.email && (
							<Text style={styles.fieldError}>{formErrors.email}</Text>
						)}
					</View>

					{/* Password Input */}
					<View style={styles.inputGroup}>
						<FormLabel>Password</FormLabel>
						<View style={styles.passwordContainer}>
							<FormInput
								value={password}
								onChangeText={(text) => {
									setPassword(text);
									if (formErrors.password) {
										setFormErrors({ ...formErrors, password: undefined });
									}
								}}
								placeholder="Enter your password"
								secureTextEntry={securePassword}
								textContentType="password"
								editable={!isLoading}
								style={styles.passwordInput}
							/>
							<TouchableOpacity
								onPress={() => setSecurePassword(!securePassword)}
								style={styles.eyeIcon}
							>
								<Text style={styles.eyeIconText}>
									{securePassword ? "👁️" : "👁️‍🗨️"}
								</Text>
							</TouchableOpacity>
						</View>
						{formErrors.password && (
							<Text style={styles.fieldError}>{formErrors.password}</Text>
						)}
					</View>

					{/* Forgot Password */}
					<TouchableOpacity style={styles.forgotPassword}>
						<Text style={styles.forgotText}>Forgot password?</Text>
					</TouchableOpacity>

					{/* Login Button */}
					<PrimaryButton
						title="Login"
						onPress={handleLogin}
						disabled={isLoading}
						loading={isLoading}
						style={{ marginBottom: Spacing.xxxl }}
					/>

					{/* Register Link */}
					<View style={styles.footer}>
						<Text style={styles.footerText}>Not a member? </Text>
						<TouchableOpacity
							onPress={() => navigation.navigate("Register")}
							disabled={isLoading}
						>
							<Text style={styles.registerText}>Register now</Text>
						</TouchableOpacity>
					</View>

					{/* Business Login Link */}
					<TouchableOpacity
						style={styles.businessContainer}
						onPress={() => navigation.navigate("SignInBusiness")}
						disabled={isLoading}
					>
						<Text style={styles.businessText}>Log in as business</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.white,
	},
	scrollContent: {
		flexGrow: 1,
	},
	content: {
		flex: 1,
		padding: Spacing.xl,
		justifyContent: "center",
	},
	logo: {
		width: width * 0.6,
		height: 100,
		alignSelf: "center",
		marginBottom: Spacing.xxxl,
		resizeMode: "contain",
	},
	title: {
		...Typography.h2,
		textAlign: "center",
		marginBottom: Spacing.xl,
		color: Colors.textPrimary,
	},
	errorBox: {
		marginBottom: Spacing.lg,
	},
	inputGroup: {
		marginBottom: Spacing.lg,
	},
	passwordContainer: {
		position: "relative",
	},
	passwordInput: {
		paddingRight: 50,
	},
	eyeIcon: {
		position: "absolute",
		right: Spacing.md,
		top: Spacing.md,
		padding: Spacing.xs,
	},
	eyeIconText: {
		fontSize: 20,
	},
	fieldError: {
		...Typography.caption,
		color: Colors.error,
		marginTop: Spacing.xs,
	},
	forgotPassword: {
		alignSelf: "flex-end",
		marginBottom: Spacing.xl,
	},
	forgotText: {
		...Typography.small,
		color: Colors.primary,
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		marginBottom: Spacing.xl,
	},
	footerText: {
		...Typography.body,
		color: Colors.textSecondary,
	},
	registerText: {
		...Typography.bodyBold,
		color: Colors.primary,
	},
	businessContainer: {
		alignItems: "center",
	},
	businessText: {
		...Typography.small,
		color: Colors.primary,
		textDecorationLine: "underline",
	},
});

export default SignInScreen;
