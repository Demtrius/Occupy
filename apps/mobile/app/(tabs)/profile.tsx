import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "@/state/auth.store";

export default function Profile() {
	const user = useAuthStore((s) => s.user);
	const clear = useAuthStore((s) => s.clear);
	return (
		<View className="flex-1 items-center justify-center">
			<Text className="text-xl mb-2">Hello {user?.username ?? "user"}</Text>
			<Pressable
				className="bg-neutral-200 rounded-xl px-4 py-2"
				onPress={async () => {
					await clear();
					router.replace("/(auth)/login");
				}}
			>
				<Text>Logout</Text>
			</Pressable>
		</View>
	);
}
