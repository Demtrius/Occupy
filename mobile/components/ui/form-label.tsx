import React from "react";
import { Text, StyleSheet, TextStyle } from "react-native";

interface FormLabelProps {
	children: string;
	required?: boolean;
	style?: TextStyle;
}

export const FormLabel: React.FC<FormLabelProps> = ({
	children,
	required = false,
	style,
}) => {
	return (
		<Text style={[styles.label, style]}>
			{children}
			{required && <Text style={styles.required}> *</Text>}
		</Text>
	);
};

const styles = StyleSheet.create({
	label: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginBottom: 8,
	},
	required: {
		color: "#ff6b6b",
	},
});
