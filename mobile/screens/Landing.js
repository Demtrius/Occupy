import React, { useContext } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Context } from '../components/globalContext/globalContext';
import SignIn from '../screens/SignIn';
import Home from '../screens/Home';
import Register from '../screens/Register';

function Landing({ navigation }) {
  const globalContext = useContext(Context);
  const { isLoggedIn } = globalContext;

  console.log('API URL:', process.env.EXPO_PUBLIC_BACKEND_URL);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome to Occupy!</Text>
      <Text style={styles.status}>
        You are {isLoggedIn ? '' : 'Not'} Logged in
      </Text>
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={() => navigation.navigate('SignIn')}
      >
        <Text>Sign in</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={() => navigation.navigate('Register')}
      >
        <Text>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    margin: 10,
  },
  greeting: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  status: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 23,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 5,
    paddingBottom: 10,
    marginBottom: 30,
    elevation: 90,
    backgroundColor: 'grey',
  },
});

export default Landing;
