import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '../store/auth.store';
import { showError, showSuccess } from '../store/app.store';
import { RegisterData } from '../types';
import { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

type RegisterNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface RegisterProps {
  navigation: RegisterNavigationProp;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  occupation?: string;
}

const Register: React.FC<RegisterProps> = ({ navigation }) => {
  const register = useAuthStore(state => state.register);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [occupation, setOccupation] = useState<string>('');
  const [securePassword, setSecurePassword] = useState<boolean>(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Username validation
    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }

    // Password validation
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Occupation validation (optional but with minimum length if provided)
    if (occupation.trim() && occupation.length < 2) {
      errors.occupation = 'Occupation must be at least 2 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle registration
  const handleRegister = async () => {
    // Clear previous errors
    clearError();
    setFormErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const registerData: RegisterData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        fullName: occupation.trim() || undefined,
        bio: undefined,
      };

      await register(registerData);
      showSuccess('Registration successful! Welcome!');
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'Registration failed. Please try again.';
      showError(errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Account</Text>

          {/* Display global error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <TextInput
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (formErrors.username) {
                    setFormErrors({ ...formErrors, username: undefined });
                  }
                }}
                placeholder="Username"
                placeholderTextColor="#888"
                style={[styles.input, formErrors.username && styles.inputError]}
                autoCapitalize="none"
                textContentType="username"
                editable={!isLoading}
              />
              {formErrors.username && (
                <Text style={styles.fieldError}>{formErrors.username}</Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (formErrors.email) {
                    setFormErrors({ ...formErrors, email: undefined });
                  }
                }}
                placeholder="Email"
                placeholderTextColor="#888"
                style={[styles.input, formErrors.email && styles.inputError]}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!isLoading}
              />
              {formErrors.email && (
                <Text style={styles.fieldError}>{formErrors.email}</Text>
              )}
            </View>

            {/* Occupation Input */}
            <View style={styles.inputGroup}>
              <TextInput
                value={occupation}
                onChangeText={(text) => {
                  setOccupation(text);
                  if (formErrors.occupation) {
                    setFormErrors({ ...formErrors, occupation: undefined });
                  }
                }}
                placeholder="Occupation (optional)"
                placeholderTextColor="#888"
                style={[styles.input, formErrors.occupation && styles.inputError]}
                editable={!isLoading}
              />
              {formErrors.occupation && (
                <Text style={styles.fieldError}>{formErrors.occupation}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (formErrors.password) {
                      setFormErrors({ ...formErrors, password: undefined });
                    }
                  }}
                  placeholder="Password"
                  placeholderTextColor="#888"
                  secureTextEntry={securePassword}
                  style={[
                    styles.input,
                    styles.passwordInput,
                    formErrors.password && styles.inputError,
                  ]}
                  textContentType="newPassword"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setSecurePassword(!securePassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeIconText}>
                    {securePassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {formErrors.password && (
                <Text style={styles.fieldError}>{formErrors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (formErrors.confirmPassword) {
                      setFormErrors({ ...formErrors, confirmPassword: undefined });
                    }
                  }}
                  placeholder="Confirm Password"
                  placeholderTextColor="#888"
                  secureTextEntry={secureConfirmPassword}
                  style={[
                    styles.input,
                    styles.passwordInput,
                    formErrors.confirmPassword && styles.inputError,
                  ]}
                  textContentType="newPassword"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeIconText}>
                    {secureConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {formErrors.confirmPassword && (
                <Text style={styles.fieldError}>{formErrors.confirmPassword}</Text>
              )}
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            onPress={handleRegister}
            style={[styles.registerButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerText}>Register</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn')}
            style={styles.backButton}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    color: '#000',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    width: '100%',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 15,
    paddingRight: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 15,
    padding: 4,
  },
  eyeIconText: {
    fontSize: 20,
  },
  fieldError: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: '#6ba32d',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginBottom: 20,
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
  registerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 10,
  },
  backButtonText: {
    color: '#6ba32d',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Register;
