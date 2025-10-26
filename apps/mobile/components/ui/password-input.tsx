import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, type TextInputProps } from "react-native";
import { Input } from "./input";
import { Box } from "./restyle-components";

export function PasswordInput(props: TextInputProps) {
	const [show, setShow] = useState(false);

	return (
		<Box position="relative">
			<Input secureTextEntry={!show} {...props} />
			<Pressable
				style={{
					position: "absolute",
					right: 16,
					top: 12,
				}}
				onPress={() => setShow((s) => !s)}
			>
				<Ionicons
					name={show ? "eye-off-outline" : "eye-outline"}
					size={20}
					color="#71717b"
				/>
			</Pressable>
		</Box>
	);
}
