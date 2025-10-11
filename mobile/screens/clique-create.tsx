import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableWithoutFeedback,
	Keyboard,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
	CliqueForm,
	InfoBox,
	ScreenHeader,
	FormActions,
} from "../components";
import { useCliqueForm } from "../hooks";
import {
	Colors,
	Spacing,
	Typography,
	BorderRadius,
	CommonStyles,
} from "../theme";

const CliqueCreate: React.FC = () => {
	const navigation = useNavigation();

	const { values, errors, handleChange, handleSubmit, isSubmitting } =
		useCliqueForm((newClique) => (navigation as any).navigate('CliqueDetail', { id: newClique.id }));

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

						{/* Form Actions */}
						<FormActions
							submitTitle="Create Clique"
							onSubmit={handleSubmit}
							onCancel={() => (navigation as any).goBack()}
							isSubmitting={isSubmitting}
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

});

export default CliqueCreate;
