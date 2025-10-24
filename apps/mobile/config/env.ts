import Constants from "expo-constants";
import { Platform } from "react-native";

export const scheme = Constants.expoConfig?.extra?.scheme ?? "occupy";

const devBase =
	Platform.OS === "android"
		? "http://10.0.2.2:8000"
		: (Constants.expoConfig?.extra?.apiBaseUrlDev ?? "http://localhost:8000");
const prodBase =
	Constants.expoConfig?.extra?.apiBaseUrlProd ?? "https://occupy-app.com";

export const API_BASE_URL = (__DEV__ ? devBase : prodBase).replace(/\/$/, "");
