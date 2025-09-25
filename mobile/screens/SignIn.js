import React, { useContext, useState } from 'react';
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
  Alert,
} from 'react-native';
import { Context } from '../components/globalContext/globalContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

function SignIn({ navigation }) {
  const globalContext = useContext(Context);
  const { setIsLoggedIn, setOccupierObj, setAuthTokens } = globalContext;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Debug function
  const debugAPI = async () => {
    console.log('🔍 Debug Info:');
    console.log('API URL:', process.env.EXPO_PUBLIC_BACKEND_URL);
    console.log('Email:', username);
    console.log('Password length:', password.length);
  };

  const handleLogin = async () => {
    // Clear previous errors
    setError('');
    
    // Validate inputs
    if (!username.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    await debugAPI();

    const body = JSON.stringify({
      email: username.trim(),
      password: password
    });

    try {
      console.log('🚀 Making login request...');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body
      });

      console.log('📡 Response status:', response.status);
      const json = await response.json();
      console.log('📦 Response data:', json);

      if (response.ok) {
        console.log('✅ Login successful');
        
        // Store user data
        setOccupierObj(json);
        setAuthTokens(json.token);
        setIsLoggedIn(true);
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('authTokens', JSON.stringify(json));
        
        Alert.alert('Success', 'Login successful!');
        
      } else {
        console.log('❌ Login failed:', json);
        // Handle different error response formats
        const errorMessage = json.message || 
                            json.detail || 
                            json.error || 
                            json.non_field_errors?.[0] ||
                            "Invalid credentials";
        setError(errorMessage);
      }
    } catch (error) {
      console.error('💥 Network error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // REMOVED THE PROBLEMATIC useEffect - this was causing automatic login attempts
  // useEffect(() => {
  //   if (username && password) {
  //     handleLogin();
  //   }
  // }, [username, password]);

  // Test credentials function for development
  const fillTestCredentials = () => {
    setUsername('Kovon@gmail.com');
    Alert.alert('Test Credentials', 'Test email filled. Please enter the password and tap Login.');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <Image
            source={require('../assets/occupyLogo.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome User!</Text>
          
          {/* Debug info - shows API URL */}
          <Text style={styles.debugText}>
            API: {process.env.EXPO_PUBLIC_BACKEND_URL}
          </Text>
          
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <TextInput
              value={username}
              onChangeText={(text) => setUsername(text)}
              placeholder="Username"
              placeholderTextColor="#888"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="username"
              editable={!loading}
            />

            <TextInput
              value={password}
              onChangeText={(text) => setPassword(text)}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={securePassword}
              style={styles.input}
              editable={!loading}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Test credentials button for development */}
          <TouchableOpacity onPress={fillTestCredentials} style={styles.testButton}>
            <Text style={styles.testButtonText}>Fill Test Credentials</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogin} 
            style={[styles.loginButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Not a member? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerText}>Register now</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.businessContainer}>
            <Text style={styles.businessText} onPress={() => navigation.navigate("SignInBusiness")}>
              Log in as business
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  forgotText: {
    color: '#007AFF',
    fontSize: 14,
  },
  testButton: {
    backgroundColor: '#FFA500',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  testButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#ccc',
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
