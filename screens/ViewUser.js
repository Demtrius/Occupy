import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const ViewUser = ({ route }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Posts');
  const [search, setSearch] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [masterDataSource, setMasterDataSource] = useState([]);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const searchBarRef = useRef(null);

  // get the post id from the parameters
  const { id } = route.params;

  const getUserData = () => {
    console.log("############################################################")
    axios
      // .get(`/api/user/${id}/posts`)
      .get(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/current-occupier/' + id)
      .then((response) => {
        const userData = response.data.posts;
        console.log(response.data)
        setFilteredDataSource(userData);
        setMasterDataSource(userData);
      })
      .catch((error) => console.log(error))
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => getUserData(), [id]);

  const searchFilterFunction = (text) => {
    if (text) {
      const newData = masterDataSource.filter((item) => {
        const itemData = item.name ? item.name.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredDataSource(newData);
      setSearch(text);
    } else {
      setFilteredDataSource(masterDataSource);
      setSearch(text);
      setShowSearchBar(false); // Close search bar if text is empty
    }
  };

  const renderPosts = ({ item }) => {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: 'https://placecats.com/300/200' }} style={styles.cardImage} />
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderReviews = () => {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Reviews coming soon...</Text>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.headerContainer}>
        {!showSearchBar && (
          <>
            <Text style={styles.headerTitle}>User Profile</Text>
            <TouchableOpacity
              onPress={() => {
                setShowSearchBar(true);
                setTimeout(() => {
                  searchBarRef.current.focus();
                }, 100);
              }}
              style={styles.searchIcon}
            >
              <Ionicons name="search" size={24} color="black" />
            </TouchableOpacity>
          </>
        )}
        {showSearchBar && (
          <PaperSearchbar
            ref={searchBarRef}
            style={styles.searchBar}
            placeholder="Search"
            value={search}
            onChangeText={(text) => searchFilterFunction(text)}
            onBlur={() => {
              if (!search) setShowSearchBar(false); // Close search bar if text is empty
            }}
          />
        )}
      </View>
      <View style={styles.tabContainer}>
        {['Posts', 'Reviews'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#6ba32d" />
      ) : (
        <>
          {activeTab === 'Posts' && (
            <FlatList
              data={filteredDataSource}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderPosts}
              contentContainerStyle={styles.listContainer}
            />
          )}
          {activeTab === 'Reviews' && renderReviews()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: height * 0.08, // Add padding to avoid content getting under the dynamic island
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the header text
    alignItems: 'center',
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1, // Take up remaining space
    textAlign: 'center', // Center the text
    paddingLeft: 40, // Add padding to the left to avoid the icon being too close to the edge
  },
  searchIcon: {
    paddingRight: 16, // Add padding to the right to avoid the icon being too close to the edge
  },
  searchBar: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
    width: width * 0.92, // Ensure the same width as on Search.js
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6ba32d',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#6ba32d',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: '#6ba32d',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
  },
});

export default ViewUser;