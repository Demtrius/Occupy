import type React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import {
  FormInput,
} from '../ui/form-input';
import {
  FormLabel,
} from '../ui/form-label';
import { Colors, Spacing, Typography } from '../../theme';

type Level = 'PRIVATE' | 'PUBLIC';

interface CliqueFormValues {
  name: string;
  description: string;
  occupation: string;
  level: Level;
}

interface CliqueFormProps {
  values: CliqueFormValues;
  errors: Partial<Record<keyof CliqueFormValues, string>>;
  handleChange: (name: keyof CliqueFormValues, value: string | number | boolean | ((prev: any) => any)) => void;
}

const CliqueForm: React.FC<CliqueFormProps> = ({
  values,
  errors,
  handleChange,
}) => {
  const [open, setOpen] = useState<boolean>(false);

  const levelOptions = [
    { label: 'Public - Anyone can join', value: 'PUBLIC' as Level },
    { label: 'Private - Invite only', value: 'PRIVATE' as Level },
  ];

  return (
    <>
      {/* Clique Name */}
      <View style={styles.inputGroup}>
        <FormLabel required>Clique Name</FormLabel>
        <FormInput
          value={values.name}
          onChangeText={(text) => handleChange('name', text)}
          placeholder="e.g., Software Developers Hub"
          maxLength={100}
        />
        {errors.name && (
          <Text style={styles.errorText}>{errors.name}</Text>
        )}
      </View>

      {/* Occupation */}
      <View style={styles.inputGroup}>
        <FormLabel required>Occupation</FormLabel>
        <FormInput
          value={values.occupation}
          onChangeText={(text) => handleChange('occupation', text)}
          placeholder="e.g., Software Development, Design"
          maxLength={100}
        />
        {errors.occupation && (
          <Text style={styles.errorText}>{errors.occupation}</Text>
        )}
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <FormLabel required>Description</FormLabel>
        <FormInput
          value={values.description}
          onChangeText={(text) => handleChange('description', text)}
          placeholder="Describe what this clique is about..."
          multiline
          maxLength={500}
          showCharacterCount
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}
      </View>

      {/* Privacy Level */}
      <View style={styles.inputGroup}>
        <FormLabel required>Privacy Level</FormLabel>
        <DropDownPicker
          open={open}
          value={values.level}
          items={levelOptions}
          setOpen={setOpen}
          setValue={(value) => handleChange('level', value)}
          setItems={() => {}} // Not needed since options are static
          style={[
            styles.dropdown,
            errors.level && styles.dropdownError,
          ]}
          placeholder="Select privacy level"
          dropDownContainerStyle={styles.dropdownContainer}
          theme="LIGHT"
          listMode="SCROLLVIEW"
        />
        {errors.level && (
          <Text style={styles.errorText}>{errors.level}</Text>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  dropdown: {
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  dropdownError: {
    borderColor: Colors.error,
  },
  dropdownContainer: {
    borderColor: Colors.border,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});

export { CliqueForm };