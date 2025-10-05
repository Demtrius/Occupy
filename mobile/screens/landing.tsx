import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '../store/auth.store';
import { RootStackParamList } from '../types';

type LandingNavigationProp = StackNavigationProp<RootStackParamList, 'Landing'>;

interface LandingProps {
  navigation: LandingNavigationProp;
}

const Landing: React.FC<LandingProps> = ({ navigation }) => {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/occupyLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.greeting}>Welcome to Occupy!</Text>
        <Text style={styles.subtitle}>
          Connect with your community and discover opportunities
        </Text>

        {__DEV__ && (
          <Text style={styles.debugText}>
            Status: {isLoggedIn ? 'Logged In' : 'Not Logged In'}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.businessLink}
          onPress={() => navigation.navigate('SignInBusiness')}
        >
          <Text style={styles.businessLinkText}>Business Login →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 120,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  businessLink: {
    alignItems: 'center',
    marginTop: 10,
  },
  businessLinkText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default Landing;
