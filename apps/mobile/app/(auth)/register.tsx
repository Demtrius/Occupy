// app/(auth)/register.tsx

import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRegister } from "@/hooks/use-auth";

export default function Register() {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [pw, setPw] = useState("");
	const { mutateAsync, isPending, error } = useRegister();

	return (
		<View className="flex-1 justify-center px-4">
			<Text className="text-2xl mb-4">Register</Text>
			<TextInput
				placeholder="email"
				value={email}
				onChangeText={setEmail}
				autoCapitalize="none"
				className="border rounded-xl p-3 mb-3"
			/>
			<TextInput
				placeholder="username"
				value={username}
				onChangeText={setUsername}
				autoCapitalize="none"
				className="border rounded-xl p-3 mb-3"
			/>
			<TextInput
				placeholder="password"
				value={pw}
				onChangeText={setPw}
				secureTextEntry
				autoCapitalize="none"
				className="border rounded-xl p-3 mb-3"
			/>
			<Pressable
				className="bg-blue-600 rounded-xl p-3 items-center"
				disabled={isPending}
				onPress={async () => {
					try {
						await mutateAsync({ email, username, password: pw });
						router.replace("/(tabs)");
					} catch (e: any) {
						console.log("register error", e?.detail);
					}
				}}
			>
				<Text className="text-white">
					{isPending ? "..." : "Create account"}
				</Text>
			</Pressable>
			{error ? (
				<Text className="text-red-500 mt-2">{String(error)}</Text>
			) : null}
		</View>
	);
}
