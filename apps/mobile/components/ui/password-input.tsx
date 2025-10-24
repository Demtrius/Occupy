import { useState } from "react";
import { Pressable, type TextInputProps } from "react-native";
import { Box, Input, Text } from "./restyle-components";

export function PasswordInput(props: TextInputProps) {
	const [show, setShow] = useState(false);

	return (
		<Box position="relative">
			<Input secureTextEntry={!show} {...props} />
			<Pressable
				style={{
					position: "absolute",
					right: 16,
					top: 16,
				}}
				onPress={() => setShow((s) => !s)}
			>
				<Text variant="caption">{show ? "Hide" : "Show"}</Text>
			</Pressable>
		</Box>
	);
}
