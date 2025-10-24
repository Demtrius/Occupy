import type React from "react";
import {
	type Control,
	Controller,
	type FieldError,
	type FieldValues,
	type UseControllerProps,
} from "react-hook-form";
import { FormDescription } from "./form-description";
import { FormMessage } from "./form-message";
import { Label } from "./label";
import { Box } from "./restyle-components";

export function FormField<T extends FieldValues>({
	name,
	control,
	label,
	description,
	render,
}: UseControllerProps<T> & {
	label?: string;
	description?: string;
	render: (args: {
		value: any;
		onChange: (v: any) => void;
		onBlur: () => void;
		error?: FieldError;
	}) => React.ReactNode;
}) {
	return (
		<Controller
			name={name as any}
			control={control as Control<T>}
			render={({
				field: { value, onChange, onBlur },
				fieldState: { error },
			}) => (
				<Box marginBottom="m">
					{label ? <Label>{label}</Label> : null}
					{render({ value, onChange, onBlur, error })}
					{error ? (
						<FormMessage>{error.message}</FormMessage>
					) : (
						<FormDescription>{description}</FormDescription>
					)}
				</Box>
			)}
		/>
	);
}
