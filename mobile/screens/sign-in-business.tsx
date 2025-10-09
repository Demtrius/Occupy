import React, { useState } from "react";
import {
	View,
	StyleSheet,
	Text,
	TouchableOpacity,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Image,
	Dimensions,
	ActivityIndicator,
} from "react-native";
import { useAuthStore } from "../store/auth.store";
import { showError, showSuccess } from "../store/app.store";
import { LoginCredentials, ScreenNavigationProp } from "../types";

const { width } = Dimensions.get("window");

interface SignInBusinessProps {
	navigation: ScreenNavigationProp<"SignInBusiness">;
}

interface FormErrors {
	email?: string;
	password?: string;
}

const SignInBusinessScreen: React.FC<SignInBusinessProps> = ({
	navigation,
}) => {
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
			showSuccess("Business login successful!");
		} catch (err: any) {
			console.error("Business login error:", err);
			const errorMessage =
				err.message || "Login failed. Please check your credentials.";
			showError(errorMessage);
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView
				contentContainerStyle={{ flexGrow: 1 }}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.container}>
					<Image
						source={require("../assets/occupyLogo.png")}
						style={styles.logo}
					/>
					<Text style={styles.title}>Welcome Business!</Text>

					{/* Display global error */}
					{error && (
						<View style={styles.errorContainer}>
							<Text style={styles.errorText}>{error}</Text>
						</View>
					)}

					<View style={styles.inputContainer}>
						{/* Email Input */}
						<View style={styles.inputGroup}>
							<TextInput
								value={email}
								onChangeText={(text) => {
									setEmail(text);
									if (formErrors.email) {
										setFormErrors({ ...formErrors, email: undefined });
									}
								}}
								placeholder="Email Address"
								placeholderTextColor="#888"
								style={[styles.input, formErrors.email && styles.inputError]}
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
							<View style={styles.passwordContainer}>
								<TextInput
									value={password}
									onChangeText={(text) => {
										setPassword(text);
										if (formErrors.password) {
											setFormErrors({ ...formErrors, password: undefined });
										}
									}}
									placeholder="Password"
									placeholderTextColor="#888"
									secureTextEntry={securePassword}
									style={[
										styles.input,
										styles.passwordInput,
										formErrors.password && styles.inputError,
									]}
									textContentType="password"
									editable={!isLoading}
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
					</View>

					<TouchableOpacity style={styles.forgotPassword}>
						<Text style={styles.forgotText}>Forgot password?</Text>
					</TouchableOpacity>

					{/* Login Button */}
					<TouchableOpacity
						onPress={handleLogin}
						style={[styles.loginButton, isLoading && styles.disabledButton]}
						disabled={isLoading}
					>
						{isLoading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.loginText}>Login</Text>
						)}
					</TouchableOpacity>

					{/* Register Link */}
					<View style={styles.footer}>
						<Text style={styles.footerText}>Not a Business member? </Text>
						<TouchableOpacity
							onPress={() => navigation.navigate("RegisterBusiness")}
							disabled={isLoading}
						>
							<Text style={styles.registerText}>Register now</Text>
						</TouchableOpacity>
					</View>

					{/* User Login Link */}
					<TouchableOpacity
						style={styles.businessContainer}
						onPress={() => navigation.navigate("SignIn")}
						disabled={isLoading}
					>
						<Text style={styles.userText}>Log in as user</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	logo: {
		width: width,
		height: 180,
		marginBottom: 20,
		marginTop: -50,
		resizeMode: "contain",
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
		marginBottom: 30,
		color: "#000",
		textAlign: "left",
		alignSelf: "stretch",
	},
	errorContainer: {
		backgroundColor: "#ffebee",
		padding: 12,
		borderRadius: 8,
		marginBottom: 20,
		borderLeftWidth: 4,
		borderLeftColor: "#f44336",
		width: "100%",
	},
	errorText: {
		color: "#f44336",
		fontSize: 14,
		textAlign: "center",
	},
	inputContainer: {
		width: "100%",
		marginBottom: 20,
	},
	inputGroup: {
		marginBottom: 15,
	},
	input: {
		width: "100%",
		height: 50,
		borderColor: "#ccc",
		borderWidth: 1,
		borderRadius: 8,
		paddingLeft: 15,
		paddingRight: 15,
		fontSize: 16,
		backgroundColor: "#fff",
		color: "#333",
	},
	inputError: {
		borderColor: "#f44336",
		backgroundColor: "#ffebee",
	},
	passwordContainer: {
		position: "relative",
	},
	passwordInput: {
		paddingRight: 50,
	},
	eyeIcon: {
		position: "absolute",
		right: 12,
		top: 15,
		padding: 4,
	},
	eyeIconText: {
		fontSize: 20,
	},
	fieldError: {
		color: "#f44336",
		fontSize: 12,
		marginTop: 4,
		marginLeft: 4,
	},
	forgotPassword: {
		marginBottom: 30,
		textAlign: "left",
		alignSelf: "stretch",
	},
	forgotText: {
		color: "#6ba32d",
		fontSize: 14,
	},
	loginButton: {
		backgroundColor: "#6ba32d",
		borderRadius: 10,
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		height: 50,
		marginBottom: 20,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	disabledButton: {
		backgroundColor: "#ccc",
		opacity: 0.7,
	},
	loginText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "500",
	},
	footer: {
		flexDirection: "row",
		marginBottom: 20,
		textAlign: "left",
		alignSelf: "stretch",
	},
	footerText: {
		color: "#888",
		fontSize: 14,
	},
	registerText: {
		color: "#6ba32d",
		fontSize: 14,
		fontWeight: "500",
	},
	businessContainer: {
		alignSelf: "stretch",
	},
	userText: {
		color: "#6ba32d",
		fontSize: 16,
		fontWeight: "500",
		textAlign: "left",
		alignSelf: "stretch",
	},
});

export default SignInBusinessScreen;
