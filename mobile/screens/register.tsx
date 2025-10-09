import React, { useState } from "react";
import {
	View,
	StyleSheet,
	Text,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { useAuthStore } from "../store/auth.store";
import { showError, showSuccess } from "../store/app.store";
import { RegisterData } from "../types/auth";
import { ScreenNavigationProp } from "../types";
import {
	FormLabel,
	FormInput,
	PrimaryButton,
	InfoBox,
	ScreenHeader,
} from "../components";
import { Colors, Spacing, Typography } from "../theme";

interface RegisterProps {
	navigation: ScreenNavigationProp<"Register">;
}

interface FormErrors {
	username?: string;
	email?: string;
	password?: string;
	confirmPassword?: string;
	occupation?: string;
}

const RegisterScreen: React.FC<RegisterProps> = ({ navigation }) => {
	const register = useAuthStore((state) => state.register);
	const isLoading = useAuthStore((state) => state.isLoading);
	const error = useAuthStore((state) => state.error);
	const clearError = useAuthStore((state) => state.clearError);

	const [username, setUsername] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [occupation, setOccupation] = useState<string>("");
	const [securePassword, setSecurePassword] = useState<boolean>(true);
	const [secureConfirmPassword, setSecureConfirmPassword] =
		useState<boolean>(true);
	const [formErrors, setFormErrors] = useState<FormErrors>({});

	// Validate form
	const validateForm = (): boolean => {
		const errors: FormErrors = {};

		// Username validation
		if (!username.trim()) {
			errors.username = "Username is required";
		} else if (username.length < 3) {
			errors.username = "Username must be at least 3 characters";
		} else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
			errors.username =
				"Username can only contain letters, numbers, and underscores";
		}

		// Email validation
		if (!email.trim()) {
			errors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			errors.email = "Email is invalid";
		}

		// Password validation
		if (!password.trim()) {
			errors.password = "Password is required";
		} else if (password.length < 8) {
			errors.password = "Password must be at least 8 characters";
		}

		// Confirm password validation
		if (!confirmPassword.trim()) {
			errors.confirmPassword = "Please confirm your password";
		} else if (password !== confirmPassword) {
			errors.confirmPassword = "Passwords do not match";
		}

		// Occupation validation (required field)
		if (!occupation.trim()) {
			errors.occupation = "Occupation is required";
		} else if (occupation.length < 2) {
			errors.occupation = "Occupation must be at least 2 characters";
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// Handle registration
	const handleRegister = async () => {
		// Clear previous errors
		clearError();
		setFormErrors({});

		// Validate form
		if (!validateForm()) {
			showError("Please fill in all required fields correctly");
			return;
		}

		try {
			const registerData = {
				username: username.trim(),
				email: email.trim().toLowerCase(),
				password,
				occupations: occupation.trim(),
			};

			await register(registerData);
			showSuccess("Registration successful! Welcome!");
		} catch (err: any) {
			console.error("Registration error:", err);
			const errorMessage =
				err.message || "Registration failed. Please try again.";
			showError(errorMessage);
		}
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScreenHeader title="Create Account" onBack={() => navigation.goBack()} />
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.content}>
					{/* Display global error */}
					{error && (
						<InfoBox variant="error" style={styles.errorBox}>
							{error}
						</InfoBox>
					)}

					{/* Username Input */}
					<View style={styles.inputGroup}>
						<FormLabel required>Username</FormLabel>
						<FormInput
							value={username}
							onChangeText={(text) => {
								setUsername(text);
								if (formErrors.username) {
									setFormErrors({ ...formErrors, username: undefined });
								}
							}}
							placeholder="Choose a unique username"
							autoCapitalize="none"
							textContentType="username"
							editable={!isLoading}
						/>
						{formErrors.username && (
							<Text style={styles.fieldError}>{formErrors.username}</Text>
						)}
					</View>

					{/* Email Input */}
					<View style={styles.inputGroup}>
						<FormLabel required>Email</FormLabel>
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

					{/* Occupation Input */}
					<View style={styles.inputGroup}>
						<FormLabel required>Occupation</FormLabel>
						<FormInput
							value={occupation}
							onChangeText={(text) => {
								setOccupation(text);
								if (formErrors.occupation) {
									setFormErrors({ ...formErrors, occupation: undefined });
								}
							}}
							placeholder="e.g., Software Developer, Designer"
							editable={!isLoading}
						/>
						{formErrors.occupation && (
							<Text style={styles.fieldError}>{formErrors.occupation}</Text>
						)}
					</View>

					{/* Password Input */}
					<View style={styles.inputGroup}>
						<FormLabel required>Password</FormLabel>
						<View style={styles.passwordContainer}>
							<FormInput
								value={password}
								onChangeText={(text) => {
									setPassword(text);
									if (formErrors.password) {
										setFormErrors({ ...formErrors, password: undefined });
									}
								}}
								placeholder="Minimum 8 characters"
								secureTextEntry={securePassword}
								textContentType="newPassword"
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

					{/* Confirm Password Input */}
					<View style={styles.inputGroup}>
						<FormLabel required>Confirm Password</FormLabel>
						<View style={styles.passwordContainer}>
							<FormInput
								value={confirmPassword}
								onChangeText={(text) => {
									setConfirmPassword(text);
									if (formErrors.confirmPassword) {
										setFormErrors({
											...formErrors,
											confirmPassword: undefined,
										});
									}
								}}
								placeholder="Re-enter your password"
								secureTextEntry={secureConfirmPassword}
								textContentType="newPassword"
								editable={!isLoading}
								style={styles.passwordInput}
							/>
							<TouchableOpacity
								onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
								style={styles.eyeIcon}
							>
								<Text style={styles.eyeIconText}>
									{secureConfirmPassword ? "👁️" : "👁️‍🗨️"}
								</Text>
							</TouchableOpacity>
						</View>
						{formErrors.confirmPassword && (
							<Text style={styles.fieldError}>
								{formErrors.confirmPassword}
							</Text>
						)}
					</View>

					{/* Register Button */}
					<PrimaryButton
						title="Register"
						onPress={handleRegister}
						disabled={isLoading}
						loading={isLoading}
						style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}
					/>

					{/* Back to Login Link */}
					<TouchableOpacity
						onPress={() => navigation.navigate("SignIn")}
						style={styles.backButton}
						disabled={isLoading}
					>
						<Text style={styles.backButtonText}>
							Already have an account? Sign in
						</Text>
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
		padding: Spacing.xl,
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
	backButton: {
		alignItems: "center",
	},
	backButtonText: {
		...Typography.body,
		color: Colors.primary,
		fontWeight: "600",
	},
});

export default RegisterScreen;
