import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { useAuthStore } from "../store/auth.store";
import {
  ScreenNavigationProp,
} from "../types";
import { PrimaryButton } from "../components";

interface LandingProps {
  navigation: ScreenNavigationProp<"Landing">;
}

const LandingScreen: React.FC<LandingProps> = ({ navigation }) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/occupyLogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.greeting}>Welcome to Occupy!</Text>
        <Text style={styles.subtitle}>
          Connect with your community and discover opportunities
        </Text>

        {__DEV__ && (
          <Text style={styles.debugText}>
            Status: {isLoggedIn ? "Logged In" : "Not Logged In"}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title="Sign In"
          onPress={() => navigation.navigate("SignIn")}
          variant="secondary"
          style={{ width: "100%", marginHorizontal: 0 }}
        />

        <PrimaryButton
          title="Create Account"
          onPress={() => navigation.navigate("Register")}
          variant="primary"
          style={{ width: "100%", marginHorizontal: 0 }}
        />

        <TouchableOpacity
          style={styles.businessLink}
          onPress={() => navigation.navigate("SignInBusiness")}
        >
          <Text style={styles.businessLinkText}>Business Login →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 120,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  debugText: {
    fontSize: 12,
    color: "#999",
    marginTop: 20,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 40,
  },
  businessLink: {
    alignItems: "center",
    marginTop: 10,
  },
  businessLinkText: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

export default LandingScreen;
