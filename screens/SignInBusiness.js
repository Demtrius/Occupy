import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { Context } from '../components/globalContext/globalContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from 'jwt-decode';

const { width } = Dimensions.get('window');

function SignInBusiness({ navigation }) {
  const globalContext = useContext(Context);
  const { setIsLoggedIn, setOccupierObj, setAuthTokens } = globalContext;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_BACKEND_URL + '/auth/token/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: username, password: password }),
        }
      );
      const data = await response.json();

      if (response.status === 200) {
        setAuthTokens(data);
        setIsLoggedIn(true);
        setOccupierObj(jwt_decode(data.access));
        await AsyncStorage.setItem('authTokens', JSON.stringify(data));
      } else {
        setError('Invalid username or password');
      }
    } catch (e) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/occupyLogo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome Business!</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

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

      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Not a Business member? </Text>
      <TouchableOpacity onPress={() => navigation.navigate("RegisterBussines")}>
        <Text style={styles.registerText}>Register now</Text>
      </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.businessContainer}>
        <Text style={styles.userText} onPress={() => navigation.navigate("SignIn")}>Log in as user</Text>
      </TouchableOpacity>
    </View>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 40,
    color: '#000',
    textAlign: 'left',
    alignSelf: 'stretch',
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
  },
  forgotPassword: {
    alignSelf: 'flex-end',
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
  },
  registerText: {
    color: '#6ba32d',
    fontSize: 14,
    fontWeight: '500',
  },
  businessContainer: {
    alignSelf: 'stretch',
  },
  userText: {
    color: '#6ba32d',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  error: {
    color: 'red',
    marginBottom: 15,
  },
  logo: {
    width: width,
    height: 180,
    marginBottom: 20,
    marginTop: -50, // Move the logo up
    resizeMode: 'contain',
  },
});

export default SignInBusiness;
