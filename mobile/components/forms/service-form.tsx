import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FormInput } from "../ui/form-input";
import { FormLabel } from "../ui/form-label";
import { OptionGrid, type Option } from "../ui/option-grid";
import { SwitchRow } from "../ui/switch-row";
import { Colors, Spacing, Typography } from "../../theme";

interface ServiceFormValues {
	title: string;
	description: string;
	price: string;
	durationMinutes: string;
	isActive: boolean;
}

interface ServiceFormProps {
	values: ServiceFormValues;
	errors: Partial<Record<keyof ServiceFormValues, string>>;
	handleChange: (name: keyof ServiceFormValues, value: any) => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({
	values,
	errors,
	handleChange,
}) => {
	const durationOptions: Option[] = [
		{ value: "15", label: "15 min" },
		{ value: "30", label: "30 min" },
		{ value: "45", label: "45 min" },
		{ value: "60", label: "1 hour" },
		{ value: "90", label: "1.5 hours" },
		{ value: "120", label: "2 hours" },
	];

	return (
		<>
			{/* Title */}
			<View style={styles.inputGroup}>
				<FormLabel required>Service Title</FormLabel>
				<FormInput
					placeholder="e.g., Haircut, Massage, Consultation"
					value={values.title}
					onChangeText={(text) => handleChange("title", text)}
					maxLength={100}
				/>
			</View>

			{/* Description */}
			<View style={styles.inputGroup}>
				<FormLabel required>Description</FormLabel>
				<FormInput
					placeholder="Describe what this service includes..."
					value={values.description}
					onChangeText={(text) => handleChange("description", text)}
					multiline
					maxLength={500}
					showCharacterCount
				/>
			</View>

			{/* Price */}
			<View style={styles.inputGroup}>
				<FormLabel>Price (Optional)</FormLabel>
				<View style={styles.priceInputContainer}>
					<Text style={styles.currencySymbol}>$</Text>
					<FormInput
						placeholder="0.00"
						value={values.price}
						onChangeText={(text) => handleChange("price", text)}
						keyboardType="decimal-pad"
						containerStyle={{ flex: 1 }}
						style={styles.priceInput}
					/>
				</View>
				<Text style={styles.hint}>
					Leave empty if pricing varies or is free
				</Text>
			</View>

			{/* Duration */}
			<View style={styles.inputGroup}>
				<FormLabel required>Duration</FormLabel>
				<OptionGrid
					options={durationOptions}
					selectedValue={values.durationMinutes}
					onSelect={(value) => handleChange("durationMinutes", value)}
					style={{ justifyContent: "space-between" }}
				/>
				<FormLabel style={styles.customDurationLabel}>
					Custom Duration (minutes)
				</FormLabel>
				<FormInput
					placeholder="Enter duration in minutes"
					value={values.durationMinutes}
					onChangeText={(text) => handleChange("durationMinutes", text)}
					keyboardType="number-pad"
				/>
			</View>

			{/* Active Status */}
			<View style={styles.inputGroup}>
				<SwitchRow
					label="Active Service"
					description={
						values.isActive
							? "Clients can book this service"
							: "Service is hidden from clients"
					}
					value={values.isActive}
					onValueChange={(value) => handleChange("isActive", value)}
				/>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	inputGroup: {
		marginBottom: Spacing.lg,
	},
	priceInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.sm,
	},
	currencySymbol: {
		...Typography.h3,
		color: Colors.primary,
	},
	priceInput: {
		flex: 1,
	},
	hint: {
		...Typography.small,
		color: Colors.textTertiary,
		marginTop: Spacing.xs,
	},
	customDurationLabel: {
		marginTop: Spacing.lg,
	},
});

export { ServiceForm };
