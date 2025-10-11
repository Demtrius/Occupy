import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { FormInput } from "./form-input";
import { FormLabel } from "./form-label";
import { Colors, Spacing, Typography } from "../../theme";

interface FormFieldProps {
	label: string;
	required?: boolean;
	error?: string;
	containerStyle?: ViewStyle;
	children?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
	label,
	required = false,
	error,
	containerStyle,
	children,
}) => {
	return (
		<View style={[styles.container, containerStyle]}>
			<FormLabel required={required}>{label}</FormLabel>
			{children}
			{error && <Text style={styles.errorText}>{error}</Text>}
		</View>
	);
};

interface TextFormFieldProps {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	required?: boolean;
	error?: string;
	multiline?: boolean;
	maxLength?: number;
	showCharacterCount?: boolean;
	keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "decimal-pad";
	containerStyle?: ViewStyle;
}

export const TextFormField: React.FC<TextFormFieldProps> = ({
	label,
	value,
	onChangeText,
	placeholder,
	required = false,
	error,
	multiline = false,
	maxLength,
	showCharacterCount = false,
	keyboardType = "default",
	containerStyle,
}) => {
	return (
		<FormField label={label} required={required} error={error} containerStyle={containerStyle}>
			<FormInput
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				multiline={multiline}
				maxLength={maxLength}
				showCharacterCount={showCharacterCount}
				keyboardType={keyboardType}
			/>
		</FormField>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: Spacing.lg,
	},
	errorText: {
		...Typography.caption,
		color: Colors.error,
		marginTop: Spacing.xs,
	},
});