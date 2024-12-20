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
  Dimensions,
} from 'react-native';
import { Context } from '../components/globalContext/globalContext';

const { width } = Dimensions.get('window');

function Register({ navigation }) {
  const globalContext = useContext(Context);
  const { setIsLoggedIn, setOccupierObj, setToken } = globalContext;

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [occupation, setOccupation] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [error, setError] = useState('');

  function handleRegister() {
    let body = JSON.stringify({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: password.toLowerCase(),
      occupations: occupation.toLowerCase(),
    });
    console.log('hi', body);
    fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    })
      .then((res) => {
        console.log('string', res);
        console.log('bye', res.ok);
        if (res.ok) {
          return res.json();
        } else {
          throw res.json();
        }
      })
      .then((json) => {
        console.log(json);
        setOccupierObj(json);
        setToken(json.token);
        setIsLoggedIn(true);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>Register</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            value={username}
            onChangeText={(text) => setUsername(text)}
            placeholder="Username"
            placeholderTextColor="#888"
            style={styles.input}
            autoCapitalize="none"
          />
          <TextInput
            value={email}
            onChangeText={(text) => setEmail(text)}
            placeholder="Email"
            placeholderTextColor="#888"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            value={occupation}
            onChangeText={(text) => setOccupation(text)}
            placeholder="Occupation"
            placeholderTextColor="#888"
            style={styles.input}
          />
          <TextInput
            secureTextEntry={securePassword}
            onChangeText={(text) => setPassword(text)}
            placeholder="Password"
            placeholderTextColor="#888"
            style={styles.input}
          />

          <TouchableOpacity onPress={handleRegister} style={styles.button}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back to Login</Text>
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
    textAlign: 'left',
  },
  button: {
    backgroundColor: '#6ba32d',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    color: '#6ba32d',
    fontSize: 16,
    fontWeight: '500',
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
});

export default Register;
