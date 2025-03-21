import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Image, Keyboard } from 'react-native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const Clique = ({route}) => {
  const [clique, setClique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Posts');
  const [search, setSearch] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [masterDataSource, setMasterDataSource] = useState([]);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const searchBarRef = useRef(null);
  const [cliqueName, setCliqueName] = useState('');
  const [cliqueInfo, setCliqueInfo] = useState({}); // Add this line

  // get the post id from the parameters
  const { id } = route.params;
  console.log(id)
  const getClique = () => {
    axios
      .get(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/'+id+'/posts')
      .then((response) => {
        const myClique = response.data.posts;
        setClique(myClique);
        setFilteredDataSource(myClique);
        setMasterDataSource(myClique);
        setCliqueName(response.data.name);
        setCliqueInfo(response.data); // Add this line
      })
      .catch((error) => console.log(error))
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => getClique(), [id]);

  const searchFilterFunction = (text) => {
    if (text) {
      const newData = masterDataSource.filter((item) => {
        const itemData = item.caption ? item.caption.toUpperCase() : ''.toUpperCase(); // Update this line
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

  const renderClique = ({ item }) => {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: 'https://placecats.com/300/200' }} style={styles.cardImage} />
        </View>
        <Text style={styles.name}>{item.caption}</Text>
        <Text style={styles.description}>{item.content}</Text>
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

  const renderCliqueInfo = () => {
    return (
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Clique Information</Text> {/* Add this line */}
        <Text style={styles.infoText}>Clique Name: {cliqueInfo.name}</Text>
        <Text style={styles.infoText}>Description: {cliqueInfo.description}</Text>
        <Text style={styles.infoText}>Members: {cliqueInfo.members.length}</Text>
        <Text style={styles.infoText}>Founded: {new Date(cliqueInfo.created_at).getFullYear()}</Text>
        <TouchableOpacity style={styles.followButton} onPress={handleFollow}> {/* Move this line */}
          <Text style={styles.followButtonText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
        </TouchableOpacity> {/* Move this line */}
      </View>
    );
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.headerContainer}>
        {!showSearchBar && (
          <>
            <Text style={styles.headerTitle}>{cliqueName}</Text> {/* Update this line */}
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
        {['Posts', 'Reviews', 'Clique info'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}
            >
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
              renderItem={renderClique}
              contentContainerStyle={styles.listContainer}
            />
          )}
          {activeTab === 'Reviews' && renderReviews()}
          {activeTab === 'Clique info' && renderCliqueInfo()}
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
    paddingLeft: 30, // Remove padding to center the text
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
    height: 120, // Increase the height
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
  caption: {
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
  infoContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9', // Add this line
    borderRadius: 10, // Add this line
    margin: 16, // Add this line
    shadowColor: '#000', // Add this line
    shadowOffset: { width: 0, height: 2 }, // Add this line
    shadowOpacity: 0.1, // Add this line
    shadowRadius: 4, // Add this line
    elevation: 3, // Add this line
  },
  infoTitle: { // Add this block
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  followButton: {
    backgroundColor: '#6ba32d',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    margin: 16,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Clique;