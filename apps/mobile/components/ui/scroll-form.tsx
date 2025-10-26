import { ScrollView, type ViewProps } from "react-native";

export function ScrollForm({ children, ...rest }: ViewProps) {
	return (
		<ScrollView
			keyboardShouldPersistTaps="handled"
			contentContainerStyle={{ flex: 1, padding: 16 }}
			style={rest.style}
			{...rest}
		>
			{children}
		</ScrollView>
	);
}
