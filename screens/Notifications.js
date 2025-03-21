import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [masterDataSource, setMasterDataSource] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    // Hardcoded notifications for testing
    const hardcodedNotifications = [
      { id: 1, sender: 'Haley James', text: 'Example text', unreadCount: 9 },
      { id: 2, sender: 'Nathan Scott', text: 'Example text', unreadCount: 0 },
      { id: 3, sender: 'Brooke Davis', text: 'Example text', unreadCount: 2 },
      { id: 4, sender: 'Jamie Scott', text: 'Example text', unreadCount: 0 },
      { id: 5, sender: 'Marvin McFadden', text: 'Example text', unreadCount: 0 },
      { id: 6, sender: 'Antwon Taylor', text: 'Example text', unreadCount: 0 },
      { id: 7, sender: 'Jake Jagielski', text: 'Example text', unreadCount: 0 },
      { id: 8, sender: 'Peyton Sawyer', text: 'Example text', unreadCount: 0 },
    ];
    setNotifications(hardcodedNotifications);
    setFilteredDataSource(hardcodedNotifications);
    setMasterDataSource(hardcodedNotifications);
  }, []);

  const searchFilterFunction = (text) => {
    if (text) {
      const newData = masterDataSource.filter((item) => {
        const itemData = item.sender ? item.sender.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredDataSource(newData);
      setSearch(text);
    } else {
      setFilteredDataSource(masterDataSource);
      setSearch(text);
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={styles.postContainer}
      onPress={() => navigation.navigate('MessageDetail', { messageId: item.id })}
    >
      <Image
        source={{ uri: 'https://placecats.com/300/200' }}
        style={styles.avatar}
      />
      <View style={styles.textContainer}>
        <Text style={styles.postTitle}>{item.sender}</Text>
        <Text style={styles.text}>{item.text}</Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PaperSearchbar
        style={styles.searchBar}
        placeholder="Search"
        value={search}
        onChangeText={(text) => searchFilterFunction(text)}
      />
      <FlatList
        data={filteredDataSource}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: height * 0.08, // Add padding to avoid content getting under the dynamic island
  },
  searchBar: {
    marginHorizontal: width * 0.04,
    marginBottom: height * 0.01, // Add more room at the bottom of the search bar
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  listContainer: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.02, // Add padding between the search bar and the messages
  },
  postContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#E5E7EB',
  },
  textContainer: {
    flex: 1,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  text: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#6ba32d',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Notifications;
