import type React from "react";
import {
	Controller,
	type ControllerRenderProps,
	type FieldError,
	type FieldPath,
	type FieldValues,
	type UseControllerProps,
} from "react-hook-form";
import { FormDescription } from "./form-description";
import { FormMessage } from "./form-message";
import { Label } from "./label";
import { Box } from "./restyle-components";

export function FormField<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
>({
	name,
	control,
	label,
	description,
	render,
}: UseControllerProps<TFieldValues, TName> & {
	label?: string;
	description?: string;
	flex?: number;
	render: (args: {
		value: ControllerRenderProps<TFieldValues, TName>["value"];
		onChange: ControllerRenderProps<TFieldValues, TName>["onChange"];
		onBlur: ControllerRenderProps<TFieldValues, TName>["onBlur"];
		error?: FieldError;
	}) => React.ReactNode;
}) {
	return (
		<Controller<TFieldValues, TName>
			name={name}
			control={control}
			render={({
				field: { value, onChange, onBlur },
				fieldState: { error },
			}) => (
				<Box marginBottom="m" flexGrow={1}>
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
