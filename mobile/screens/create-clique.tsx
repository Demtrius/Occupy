import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { cliquesService } from '../services';
import { showError, showSuccess } from '../store/app.store';
import { useAuthStore } from '../store/auth.store';
import { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');

type Level = 'PRIVATE' | 'PUBLIC';

interface LevelItem {
  label: string;
  value: Level;
}

interface FormErrors {
  name?: string;
  occupation?: string;
  description?: string;
  level?: string;
}

type CreateCliqueNavigationProp = StackNavigationProp<RootStackParamList, 'CreateClique'>;

const CreateClique: React.FC = () => {
  const navigation = useNavigation<CreateCliqueNavigationProp>();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [level, setLevel] = useState<Level | null>('PUBLIC');
  const [occupation, setOccupation] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [levelItems, setLevelItems] = useState<LevelItem[]>([
    { label: 'Public - Anyone can join', value: 'PUBLIC' },
    { label: 'Private - Invite only', value: 'PRIVATE' },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!name.trim()) {
      errors.name = 'Clique name is required';
    } else if (name.trim().length < 3) {
      errors.name = 'Clique name must be at least 3 characters';
    }

    if (!occupation.trim()) {
      errors.occupation = 'Occupation is required';
    } else if (occupation.trim().length < 2) {
      errors.occupation = 'Occupation must be at least 2 characters';
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!level) {
      errors.level = 'Please select a privacy level';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create clique handler
  const handleCreateClique = async () => {
    // Check authentication
    if (!isLoggedIn || !user) {
      showError('You must be logged in to create a clique');
      navigation.navigate('SignIn' as never);
      return;
    }

    // Clear previous errors
    setFormErrors({});

    // Validate form
    if (!validateForm()) {
      showError('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);

    try {
      const cliqueData = {
        name: name.trim(),
        level: level!,
        occupation: occupation.trim(),
        description: description.trim(),
      };

      await cliquesService.createClique(cliqueData);

      showSuccess('Clique created successfully!');

      // Reset form
      setName('');
      setDescription('');
      setOccupation('');
      setLevel('PUBLIC');

      // Navigate to cliques list
      setTimeout(() => {
        navigation.navigate('Cliques' as never);
      }, 500);
    } catch (error: any) {
      console.error('Error creating clique:', error);
      const errorMessage =
        error.message || 'Failed to create clique. Please try again.';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Create New Clique</Text>
            <Text style={styles.subtitle}>
              Build a community around your interests and occupation
            </Text>

            {/* Clique Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Clique Name *</Text>
              <TextInput
                label="Enter clique name"
                value={name}
                mode="outlined"
                style={styles.input}
                onChangeText={(text) => {
                  setName(text);
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: undefined });
                  }
                }}
                theme={{ colors: { primary: '#6ba32d' } }}
                error={!!formErrors.name}
                disabled={loading}
                placeholder="e.g., Software Developers Hub"
              />
              {formErrors.name && (
                <Text style={styles.errorText}>{formErrors.name}</Text>
              )}
            </View>

            {/* Occupation */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Occupation *</Text>
              <TextInput
                label="Enter occupation"
                value={occupation}
                mode="outlined"
                style={styles.input}
                onChangeText={(text) => {
                  setOccupation(text);
                  if (formErrors.occupation) {
                    setFormErrors({ ...formErrors, occupation: undefined });
                  }
                }}
                theme={{ colors: { primary: '#6ba32d' } }}
                error={!!formErrors.occupation}
                disabled={loading}
                placeholder="e.g., Software Development, Design"
              />
              {formErrors.occupation && (
                <Text style={styles.errorText}>{formErrors.occupation}</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                label="Enter description"
                value={description}
                mode="outlined"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                onChangeText={(text) => {
                  setDescription(text);
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: undefined });
                  }
                }}
                theme={{ colors: { primary: '#6ba32d' } }}
                error={!!formErrors.description}
                disabled={loading}
                placeholder="Describe what this clique is about..."
              />
              {formErrors.description && (
                <Text style={styles.errorText}>{formErrors.description}</Text>
              )}
              <Text style={styles.helperText}>
                {description.length}/500 characters
              </Text>
            </View>

            {/* Privacy Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Privacy Level *</Text>
              <DropDownPicker
                open={open}
                value={level}
                items={levelItems}
                setOpen={setOpen}
                setValue={setLevel}
                setItems={setLevelItems}
                style={[
                  styles.dropdown,
                  formErrors.level && styles.dropdownError,
                ]}
                placeholder="Select privacy level"
                dropDownContainerStyle={styles.dropdownContainer}
                disabled={loading}
                theme="LIGHT"
                listMode="SCROLLVIEW"
              />
              {formErrors.level && (
                <Text style={styles.errorText}>{formErrors.level}</Text>
              )}
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 Tip</Text>
              <Text style={styles.infoText}>
                {level === 'PUBLIC'
                  ? 'Public cliques are visible to everyone and anyone can join.'
                  : 'Private cliques require an invitation to join and are only visible to members.'}
              </Text>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.createButton, loading && styles.disabledButton]}
              onPress={handleCreateClique}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Create Clique</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    paddingTop: height * 0.08,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
    zIndex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  dropdown: {
    borderColor: '#dcdcdc',
    borderRadius: 4,
  },
  dropdownError: {
    borderColor: '#f44336',
  },
  dropdownContainer: {
    borderColor: '#dcdcdc',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#6ba32d',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#6ba32d',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CreateClique;
