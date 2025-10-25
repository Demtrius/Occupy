import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { Platform } from "react-native";

export async function setItem(key: string, value: string): Promise<void> {
	if (Platform.OS === "web") {
		await AsyncStorage.setItem(key, value);
	} else {
		await setItemAsync(key, value);
	}
}

export async function getItem(key: string): Promise<string | null> {
	if (Platform.OS === "web") {
		return await AsyncStorage.getItem(key);
	} else {
		return await getItemAsync(key);
	}
}

export async function removeItem(key: string): Promise<void> {
	if (Platform.OS === "web") {
		await AsyncStorage.removeItem(key);
	} else {
		await deleteItemAsync(key);
	}
}
