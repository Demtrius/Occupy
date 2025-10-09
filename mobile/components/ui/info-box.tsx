import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InfoBoxProps {
  children: string | React.ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  children,
  variant = "info",
  icon,
  style,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "info":
        return styles.infoBox;
      case "success":
        return styles.successBox;
      case "warning":
        return styles.warningBox;
      case "error":
        return styles.errorBox;
      default:
        return styles.infoBox;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "info":
        return "#6ba32d";
      case "success":
        return "#4CAF50";
      case "warning":
        return "#FFA500";
      case "error":
        return "#ff6b6b";
      default:
        return "#6ba32d";
    }
  };

  const getDefaultIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (variant) {
      case "info":
        return "information-circle-outline";
      case "success":
        return "checkmark-circle-outline";
      case "warning":
        return "warning-outline";
      case "error":
        return "close-circle-outline";
      default:
        return "information-circle-outline";
    }
  };

  return (
    <View style={[styles.container, getVariantStyle(), style]}>
      <Ionicons
        name={icon || getDefaultIcon()}
        size={20}
        color={getIconColor()}
      />
      {typeof children === "string" ? (
        <Text style={styles.text}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    marginTop: 8,
    borderRadius: 12,
    gap: 12,
  },
  infoBox: {
    backgroundColor: "#e8f5e9",
  },
  successBox: {
    backgroundColor: "#e8f5e9",
  },
  warningBox: {
    backgroundColor: "#fffbea",
  },
  errorBox: {
    backgroundColor: "#ffebee",
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});
