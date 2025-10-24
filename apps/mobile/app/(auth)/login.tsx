import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useLogin } from "@/hooks/use-auth";

export default function Login() {
	const [id, setId] = useState("");
	const [pw, setPw] = useState("");
	const { mutateAsync, isPending, error } = useLogin();

	return (
		<View className="flex-1 justify-center px-4">
			<Text className="text-2xl mb-4">Login</Text>
			<TextInput
				placeholder="email or username"
				value={id}
				onChangeText={setId}
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
						await mutateAsync({ emailOrUsername: id, password: pw });
						router.replace("/(tabs)");
					} catch (e: any) {
						console.log("login error", e?.detail);
					}
				}}
			>
				<Text className="text-white">{isPending ? "..." : "Sign in"}</Text>
			</Pressable>
			{error ? (
				<Text className="text-red-500 mt-2">{String(error)}</Text>
			) : null}
			<Link href="/(auth)/register" className="mt-4 text-blue-600">
				Create account
			</Link>
		</View>
	);
}
