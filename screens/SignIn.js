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

  const handleLogin = async () => {
    let body = JSON.stringify({
      'email': username,
      'password': password
    });
  
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: body
      });
  
      if (response.ok) {
        const json = await response.json();
        setOccupierObj(json);
        setAuthTokens(json.token);
        setIsLoggedIn(true);
        await AsyncStorage.setItem('authTokens', JSON.stringify(json));
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Invalid credentials");
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height' }
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <Image
            source={require('../assets/occupyLogo.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome User!</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <TextInput
              value={username}
              onChangeText={(text) => setUsername(text)}
              placeholder="Email Address"
              placeholderTextColor="#888"
              style={styles.input}
              autoCapitalize="none"
            />

            <TextInput
              value={password}
              onChangeText={(text) => setPassword(text)}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={securePassword}
              style={styles.input}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Not a member? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerText}>Register now</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.businessContainer}>
            <Text style={styles.businessText} onPress={() => navigation.navigate("SignInBusiness")}>Log in as business</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Changed to white
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: width,
    height: 180,
    marginBottom: 20,
    marginTop: -50, // Move the logo up
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 40,
    color: '#000',
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    textAlign: 'left',
  },
  forgotPassword: {
    marginBottom: 30,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  forgotText: {
    color: '#6ba32d',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#6ba32d',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginBottom: 20,
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    marginBottom: 20,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  footerText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  registerText: {
    color: '#6ba32d',
    fontSize: 14,
    fontWeight: '500',
  },
  businessContainer: {
    alignSelf: 'stretch',
  },
  businessText: {
    color: '#6ba32d',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'left',
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
});

export default SignIn;
