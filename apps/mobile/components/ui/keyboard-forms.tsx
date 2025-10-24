import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	type ViewProps,
} from "react-native";
import { Box } from "./restyle-components";

export function KeyboardAvoidForm({ children, ...rest }: ViewProps) {
	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			style={[{ flex: 1 }, rest.style]}
			{...rest}
		>
			{children}
		</KeyboardAvoidingView>
	);
}

export function ScrollForm({ children, ...rest }: ViewProps) {
	return (
		<ScrollView
			keyboardShouldPersistTaps="handled"
			contentContainerStyle={{ padding: 16 }}
			style={rest.style}
			{...(rest as any)}
		>
			{children}
		</ScrollView>
	);
}
