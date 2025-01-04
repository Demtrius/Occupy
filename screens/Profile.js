import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Context } from '../components/globalContext/globalContext';

const { width, height } = Dimensions.get('window');

function Profile({ navigation }) {
  const globalContext = useContext(Context);
  const { setIsLoggedIn, setToken, occupierObj } = globalContext;
  const [showAccountInfo, setShowAccountInfo] = useState(false);

  const handleLogout = () => {
    setToken(null);
    setIsLoggedIn(false);
    navigation.navigate('SignIn');
  };

  const toggleAccountInfo = () => {
    setShowAccountInfo(!showAccountInfo);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar} />
        <Text style={styles.name}>{occupierObj?.username || 'User'}</Text>
        <Text style={styles.username}>@{occupierObj?.username || 'username'}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={toggleAccountInfo}>
          <Text style={styles.menuText}>Account info</Text>
        </TouchableOpacity>
        {showAccountInfo && (
          <View style={styles.accountInfo}>
            <Text style={styles.infoText}>Username: {occupierObj?.username}</Text>
            <Text style={styles.infoText}>Email: {occupierObj?.email}</Text>
            <Text style={styles.infoText}>Occupations: {occupierObj?.occupations}</Text>
            <Text style={styles.infoText}>Followers: {occupierObj?.followers}</Text>
            {/* Add more account information as needed */}
          </View>
        )}
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Recent messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Recent jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Appearance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Language</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: height * 0.08, // Add padding to avoid content getting under the dynamic island
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    color: '#777',
  },
  menu: {
    marginVertical: 20,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  accountInfo: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  logoutButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#6ba32d',
  },
  logoutButtonText: {
    color: '#6ba32d',
    fontSize: 16,
  },
});

export default Profile;
