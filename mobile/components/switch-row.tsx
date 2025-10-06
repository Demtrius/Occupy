import React from 'react';
import { View, Text, Switch, StyleSheet, ViewStyle } from 'react-native';

interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const SwitchRow: React.FC<SwitchRowProps> = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  style,
}) => {
  return (
    <View style={[styles.switchRow, style]}>
      <View style={styles.switchLabel}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.hint}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#ccc', true: '#6ba32d' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
});
