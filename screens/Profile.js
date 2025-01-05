import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { Context } from '../components/globalContext/globalContext';

const { width, height } = Dimensions.get('window');

function Profile({ navigation }) {
  const globalContext = useContext(Context);
  const { setIsLoggedIn, setToken, occupierObj } = globalContext;
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [showAppearanceInfo, setShowAppearanceInfo] = useState(false);
  const [showLanguageInfo, setShowLanguageInfo] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useEffect(() => {
    console.log('User data:', occupierObj);
  }, [occupierObj]);

  const handleLogout = () => {
    setToken(null);
    setIsLoggedIn(false);
    setLogoutModalVisible(false); // Close the modal
    navigation.navigate('SignIn');
  };

  const toggleAccountInfo = () => {
    setShowAccountInfo(!showAccountInfo);
  };

  const toggleAppearanceInfo = () => {
    setShowAppearanceInfo(!showAppearanceInfo);
  };

  const toggleLanguageInfo = () => {
    setShowLanguageInfo(!showLanguageInfo);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://placecats.com/300/300' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{occupierObj?.username || 'User'}</Text>
        <Text style={styles.username}>@{occupierObj?.username || 'username'}</Text>
      </View>

      {/* Menu Section */}
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
          </View>
        )}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('NotificationsTab')}>
          <Text style={styles.menuText}>Recent messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Recent jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={toggleAppearanceInfo}>
          <Text style={styles.menuText}>Appearance</Text>
        </TouchableOpacity>
        {showAppearanceInfo && (
          <View style={styles.accountInfo}>
            <Text style={styles.infoText}>Coming Soon</Text>
          </View>
        )}
        <TouchableOpacity style={styles.menuItem} onPress={toggleLanguageInfo}>
          <Text style={styles.menuText}>Language</Text>
        </TouchableOpacity>
        {showLanguageInfo && (
          <View style={styles.accountInfo}>
            <Text style={styles.infoText}>Coming Soon</Text>
          </View>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => setLogoutModalVisible(true)}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Log out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out? You’ll need to log in again to
              use the app.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.logoutConfirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutConfirmButtonText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: height * 0.08,
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
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#eee',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
  },
  logoutConfirmButton: {
    backgroundColor: '#6ba32d',
  },
  logoutConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default Profile;
