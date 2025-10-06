import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';

interface FormInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  showCharacterCount?: boolean;
  maxLength?: number;
  hint?: string;
  multiline?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  containerStyle,
  showCharacterCount = false,
  maxLength,
  hint,
  multiline = false,
  style,
  value,
  ...props
}) => {
  return (
    <View style={containerStyle}>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          style,
        ]}
        placeholderTextColor="#999"
        value={value}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
      {showCharacterCount && maxLength && (
        <Text style={styles.characterCount}>
          {value?.length || 0}/{maxLength}
        </Text>
      )}
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
  },
});
