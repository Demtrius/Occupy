import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface FormSectionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FormSection: React.FC<FormSectionProps> = ({ children, style }) => {
  return <View style={[styles.section, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
});
