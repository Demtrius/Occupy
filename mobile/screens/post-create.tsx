import { useAuthStore } from "@store/auth.store";
import type React from "react";
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { InfoBox, PostForm, PrimaryButton, ScreenHeader } from "../components";
import { usePostForm } from "../hooks";
import { Colors, CommonStyles, Spacing, Typography } from "../theme";

type Language = "ALL" | "ENGLISH" | "DUTCH" | "GERMAN";

const PostCreateScreen: React.FC = () => {
	const { isLoggedIn } = useAuthStore();

	const {
		values,
		errors,
		handleChange,
		handleSubmit,
		isSubmitting,
		cliqueOptions,
	} = usePostForm();

	if (!isLoggedIn) {
		return (
			<View style={CommonStyles.container}>
				<View style={CommonStyles.centered}>
					<InfoBox variant="warning">
						<Text style={styles.notLoggedInText}>
							Please log in to create a post
						</Text>
					</InfoBox>
				</View>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={CommonStyles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScreenHeader title="Create Post" showBackButton={false} />
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.content}>
						<PostForm
							values={values}
							errors={errors}
							handleChange={handleChange}
							cliqueOptions={cliqueOptions}
						/>

						{/* Create Button */}
						<PrimaryButton
							title="Create Post"
							onPress={handleSubmit}
							disabled={isSubmitting}
							loading={isSubmitting}
							style={{ marginTop: Spacing.xl }}
						/>
					</View>
				</ScrollView>
			</TouchableWithoutFeedback>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
	content: {
		padding: Spacing.xl,
	},
	inputGroup: {
		marginBottom: Spacing.lg,
	},
	captionInput: {
		minHeight: 120,
	},
	contentInput: {
		minHeight: 80,
	},
	dropdown: {
		borderColor: Colors.border,
		borderRadius: 8,
		backgroundColor: Colors.white,
	},
	dropdownContainer: {
		borderColor: Colors.border,
		maxHeight: 200,
	},
	loadingContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: Spacing.xl,
	},
	loadingText: {
		...Typography.body,
		marginLeft: Spacing.md,
		color: Colors.textSecondary,
	},
	notLoggedInText: {
		...Typography.body,
		color: Colors.textPrimary,
		textAlign: "center",
	},
	errorText: {
		...Typography.caption,
		color: Colors.error,
		marginTop: Spacing.xs,
	},
});

export default PostCreateScreen;
