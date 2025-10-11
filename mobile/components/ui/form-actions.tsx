import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { PrimaryButton } from "./primary-button";
import { Colors, Spacing, Typography, BorderRadius } from "../../theme";

interface FormActionsProps {
	submitTitle: string;
	onSubmit: () => void;
	isSubmitting?: boolean;
	cancelTitle?: string;
	onCancel?: () => void;
	disabled?: boolean;
	containerStyle?: ViewStyle;
	showCancel?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
	submitTitle,
	onSubmit,
	isSubmitting = false,
	cancelTitle = "Cancel",
	onCancel,
	disabled = false,
	containerStyle,
	showCancel = true,
}) => {
	return (
		<View style={[styles.container, containerStyle]}>
			<PrimaryButton
				title={submitTitle}
				onPress={onSubmit}
				disabled={disabled || isSubmitting}
				loading={isSubmitting}
			/>
			{showCancel && onCancel && (
				<TouchableOpacity
					style={[styles.cancelButton, disabled && styles.cancelButtonDisabled]}
					onPress={onCancel}
					disabled={disabled || isSubmitting}
				>
					<Text style={[styles.cancelButtonText, disabled && styles.cancelButtonTextDisabled]}>
						{cancelTitle}
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		gap: Spacing.md,
		marginTop: Spacing.lg,
	},
	cancelButton: {
		paddingVertical: Spacing.md,
		borderRadius: BorderRadius.md,
		alignItems: "center",
		borderWidth: 1,
		borderColor: Colors.border,
	},
	cancelButtonDisabled: {
		opacity: 0.5,
	},
	cancelButtonText: {
		...Typography.bodyBold,
		color: Colors.textSecondary,
	},
	cancelButtonTextDisabled: {
		color: Colors.textDisabled,
	},
});