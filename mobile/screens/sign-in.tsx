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
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '../store/auth.store';
import { showError, showSuccess } from '../store/app.store';
import { LoginCredentials } from '../types';
import { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

type SignInNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

interface SignInProps {
  navigation: SignInNavigationProp;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const SignIn: React.FC<SignInProps> = ({ navigation }) => {
  const login = useAuthStore(state => state.login);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [securePassword, setSecurePassword] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }

    // Password validation
    if (!password.trim()) {
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
        email: email.trim().toLowerCase(),
        password,
      };

      await login(credentials);
      showSuccess('Login successful!');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
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
          <Image
            source={require('../assets/occupyLogo.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome Back!</Text>

          {/* Display global error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
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
                <Text style={styles.fieldError}>{formErrors.password}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Not a member? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.registerText}>Register now</Text>
            </TouchableOpacity>
          </View>

          {/* Business Login Link */}
          <TouchableOpacity
            style={styles.businessContainer}
            onPress={() => navigation.navigate('SignInBusiness')}
            disabled={isLoading}
          >
            <Text style={styles.businessText}>Log in as business</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: width * 0.6,
    height: 100,
    alignSelf: 'center',
    marginBottom: 30,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
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
  errorText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
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
  loginText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  registerText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  businessContainer: {
    alignItems: 'center',
  },
  businessText: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default SignIn;
