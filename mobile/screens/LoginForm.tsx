import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { showError, showSuccess } from '../store/app.store';
import { LoginCredentials } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type LoginFormNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

interface LoginFormProps {
  navigation: LoginFormNavigationProp;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ navigation }) => {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [securePassword, setSecurePassword] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle login
  const handleLogin = async () => {
    // Clear previous errors
    clearError();
    setFormErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const credentials: LoginCredentials = {
        email: email.trim(),
        password,
      };

      await login(credentials);
      showSuccess('Login successful!');
      // Navigation will be handled automatically by App.tsx when isLoggedIn changes
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      showError(errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>LOGIN</Text>

          {/* Display global error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (formErrors.email) {
                  setFormErrors({ ...formErrors, email: undefined });
                }
              }}
              placeholder="Enter your email"
              style={[styles.input, formErrors.email && styles.inputError]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!isLoading}
            />
            {formErrors.email && (
              <Text style={styles.errorText}>{formErrors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (formErrors.password) {
                    setFormErrors({ ...formErrors, password: undefined });
                  }
                }}
                placeholder="Enter your password"
                style={[
                  styles.input,
                  styles.passwordInput,
                  formErrors.password && styles.inputError,
                ]}
                secureTextEntry={securePassword}
                textContentType="password"
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
              <Text style={styles.errorText}>{formErrors.password}</Text>
            )}
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => {
              // Navigate to forgot password screen if available
              Alert.alert('Forgot Password', 'This feature will be available soon.');
            }}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
    top: 12,
    padding: 4,
  },
  eyeIconText: {
    fontSize: 20,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#6ba32d',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#6ba32d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#a5c98a',
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerText: {
    fontSize: 16,
    color: '#666',
  },
  registerLink: {
    fontSize: 16,
    color: '#6ba32d',
    fontWeight: 'bold',
  },
});

export default LoginForm;
