import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from "react-native";

export interface Option<T = any> {
  value: T;
  label: string;
}

interface OptionGridProps<T = any> {
  options: Option<T>[];
  selectedValue?: T;
  selectedValues?: T[];
  onSelect: (value: T) => void;
  multiSelect?: boolean;
  columns?: number;
  style?: ViewStyle;
}

export function OptionGrid<T = any>({
  options,
  selectedValue,
  selectedValues = [],
  onSelect,
  multiSelect = false,
  columns = 3,
  style,
}: OptionGridProps<T>) {
  const isSelected = (value: T): boolean => {
    if (multiSelect) {
      return selectedValues.includes(value);
    }
    return selectedValue === value;
  };

  return (
    <View style={[styles.grid, style]}>
      {options.map((option) => {
        const selected = isSelected(option.value);
        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[
              styles.option,
              { width: `${100 / columns - 2}%` },
              selected && styles.optionSelected,
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.optionText, selected && styles.optionTextSelected]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    justifyContent: "center",
  },
  optionSelected: {
    backgroundColor: "#6ba32d",
    borderColor: "#6ba32d",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  optionTextSelected: {
    color: "#fff",
  },
});
