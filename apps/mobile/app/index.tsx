import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";

export default function Index() {
	const { tokens } = useAuthStore();

	return tokens ? (
		<Redirect href="/(tabs)/feed" />
	) : (
		<Redirect href="/(auth)/login" />
	);
}
