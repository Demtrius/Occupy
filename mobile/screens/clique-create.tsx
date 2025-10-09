import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableWithoutFeedback,
	Keyboard,
	ScrollView,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
	CliqueForm,
	InfoBox,
	PrimaryButton,
	ScreenHeader,
} from "../components";
import { useCliqueForm } from "../hooks";
import {
	Colors,
	Spacing,
	Typography,
	BorderRadius,
	CommonStyles,
} from "../theme";
import type { ScreenNavigationProp } from "../types";

const CliqueCreate: React.FC = () => {
	const navigation = useNavigation<ScreenNavigationProp<"CliqueCreate">>();

	const { values, errors, handleChange, handleSubmit, isSubmitting } =
		useCliqueForm();

	return (
		<KeyboardAvoidingView
			style={CommonStyles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScreenHeader
				title="Create New Clique"
				onBack={() => navigation.goBack()}
			/>

			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.content}>
						{/* Subtitle */}
						<Text style={styles.subtitle}>
							Build a community around your interests and occupation
						</Text>

						<CliqueForm
							values={values}
							errors={errors}
							handleChange={handleChange}
						/>

						{/* Info Box */}
						<InfoBox
							variant={values.level === "PUBLIC" ? "info" : "warning"}
							style={styles.infoBox}
						>
							<Text style={styles.infoText}>
								{values.level === "PUBLIC"
									? "Public cliques are visible to everyone and anyone can join."
									: "Private cliques require an invitation to join and are only visible to members."}
							</Text>
						</InfoBox>

						{/* Create Button */}
						<CliqueForm
							values={values}
							errors={errors}
							handleChange={handleChange}
						/>

						{/* Info Box */}
						<InfoBox
							variant={values.level === "PUBLIC" ? "info" : "warning"}
							style={styles.infoBox}
						>
							<Text style={styles.infoText}>
								{values.level === "PUBLIC"
									? "Public cliques are visible to everyone and anyone can join."
									: "Private cliques require an invitation to join and are only visible to members."}
							</Text>
						</InfoBox>

						{/* Create Button */}
						<PrimaryButton
							title="Create Clique"
							onPress={handleSubmit}
							disabled={isSubmitting}
							loading={isSubmitting}
							style={{ marginBottom: Spacing.md }}
						/>

						{/* Cancel Button */}
						<TouchableOpacity
							style={styles.cancelButton}
							onPress={() => navigation.goBack()}
							disabled={isSubmitting}
						>
							<Text style={styles.cancelButtonText}>Cancel</Text>
						</TouchableOpacity>
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
	subtitle: {
		...Typography.body,
		color: Colors.textSecondary,
		marginBottom: Spacing.xxxl,
	},
	inputGroup: {
		marginBottom: Spacing.lg,
	},
	errorText: {
		...Typography.caption,
		color: Colors.error,
		marginTop: Spacing.xs,
	},
	dropdown: {
		borderColor: Colors.border,
		borderRadius: BorderRadius.md,
		backgroundColor: Colors.white,
	},
	dropdownError: {
		borderColor: Colors.error,
	},
	dropdownContainer: {
		borderColor: Colors.border,
	},
	infoBox: {
		marginTop: Spacing.lg,
		marginBottom: Spacing.xl,
	},
	infoText: {
		...Typography.body,
		color: Colors.textPrimary,
		lineHeight: 20,
	},
	cancelButton: {
		paddingVertical: Spacing.md,
		borderRadius: BorderRadius.md,
		alignItems: "center",
		borderWidth: 1,
		borderColor: Colors.border,
	},
	cancelButtonText: {
		...Typography.bodyBold,
		color: Colors.textSecondary,
	},
});

export default CliqueCreate;
