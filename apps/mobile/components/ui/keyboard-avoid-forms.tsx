import { KeyboardAvoidingView, Platform, type ViewProps } from "react-native";

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
