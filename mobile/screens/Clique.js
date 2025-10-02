import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Image, ScrollView } from 'react-native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Context } from '../components/globalContext/globalContext';

const { width, height } = Dimensions.get('window');

const Clique = ({ route }) => {
  const [clique, setClique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Posts');
  const [search, setSearch] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [masterDataSource, setMasterDataSource] = useState([]);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const searchBarRef = useRef(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [cliqueName, setCliqueName] = useState('');
  const [cliqueInfo, setCliqueInfo] = useState({});
  const navigation = useNavigation();
  const globalContext = useContext(Context);
  const { occupierObj } = globalContext;
  const [isMember,setIsMember] = useState(false)

  const { id } = route.params;

  const getClique = () => {
    axios
      .get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/${id}/posts`)
      .then((response) => {
        const myClique = response.data.posts || [];
        setClique(myClique);
        setFilteredDataSource(myClique);
        setMasterDataSource(myClique);
        setCliqueName(response.data.name || 'Unknown Clique');
        setCliqueInfo(response.data);
      })
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  };

  const renderPost = ({ item }) => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.profile_image || 'https://www.gravatar.com/avatar/?d=mp' }}
          style={styles.cardImage}
        />
        <Text style={styles.author}>{item.username || 'Unknown'}</Text>
      </View>
      <Text style={styles.caption}>{item.caption || 'No Caption'}</Text>
      <Text style={styles.description}>{item.content || 'No Content Available'}</Text>
    </View>
  );








  // join clique should first check the user if it is already in the clique but this is not yet implementen in the backend user/qlique join
  const joinClique = () => {
      axios.post(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/cliques-join/', {
        clique_id: id
    }, {
      headers: {
        'Authorization': 'Bearer ' + occupierObj.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
        .then((response) => {
          setIsFollowing(!isFollowing);
        })
        .catch((error) => {
          setFeedbackMessage('Failed to join clique');
        });
    };

  useEffect(() => {
    getClique();
  }, [id]);

  const searchFilterFunction = (text) => {
    if (text) {
      const newData = masterDataSource.filter((item) => {
        const itemData = item.caption ? item.caption.toUpperCase() : '';
        return itemData.includes(text.toUpperCase());
      });
      setFilteredDataSource(newData);
    } else {
      setFilteredDataSource(masterDataSource);
    }
    setSearch(text);
    if (!text) setShowSearchBar(false);
  };


  const renderClique = ({ item }) => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
      <Image
  source={{ uri: item.profile_image || 'https://www.gravatar.com/avatar/?d=mp' }}
  style={styles.cardImage}
/>
      </View>
      <Text style={styles.name}>{item.caption || 'No Caption'}</Text>
      <Text style={styles.description}>{item.content || 'No Content Available'}</Text>
      <TouchableOpacity
        style={styles.contactButton}
        onPress={() => navigation.navigate('NotificationsTab', { screen: 'MessageDetail', params: { id: item.user_id } })}
      >
        <Text style={styles.contactButtonText}>Contact</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReviews = () => (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>Reviews coming soon...</Text>
    </View>
  );

  const renderMembers = () => {
    <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Members list coming soon...</Text>
  </View>
  }

  const renderCliqueInfo = () => (
    <View style={styles.infoContainer}>
      <Text style={styles.infoTitle}>Clique Information</Text>
      <Text style={styles.infoText}>Clique Name: {cliqueInfo.name || 'N/A'}</Text>
      <Text style={styles.infoText}>Description: {cliqueInfo.description || 'No description available'}</Text>
      <Text style={styles.infoText}>Founded: {cliqueInfo.created_at ? new Date(cliqueInfo.created_at).getFullYear() : 'Unknown'}</Text>
      <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
        <Text style={styles.followButtonText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
      </TouchableOpacity>
      <Text style={styles.infoText}>{feedbackMessage ? feedbackMessage :''}</Text>
    </View>
  );

  const handleFollow = () => {
    joinClique()
  }


  return (
<View style={styles.screenContainer}>
   {/* HEADER */}
   <ScrollView>
   <View style={styles.headerContainer}>
   <Image
    source={{ uri: cliqueInfo.banner || 'https://via.placeholder.com/600x200' }}
    style={styles.bannerImage}
    />
              <View style={styles.headerContent}>
            <Text style={styles.cliqueName}>{cliqueInfo.name || 'Unknown Clique'}</Text>
            <Text style={styles.memberCount}>{cliqueInfo.members || 0} members</Text>
            <Text style={styles.description}>{cliqueInfo.description || 'No description available'}</Text>
            <TouchableOpacity style={styles.joinButton} onPress={joinClique}>
              <Text style={styles.joinButtonText}>{isFollowing ? 'Leave Clique' : 'Join Clique'}</Text>
            </TouchableOpacity>
            {feedbackMessage ? <Text style={styles.feedback}>{feedbackMessage}</Text> : null}
          </View>

          {/* SEARCH */}
          <View style={styles.searchWrapper}>
          {!showSearchBar ? (
            <TouchableOpacity
              onPress={() => {
                setShowSearchBar(true);
                setTimeout(() => searchBarRef.current?.focus(), 100);
              }}
              style={styles.searchIcon}
            >
              <Ionicons name="search" size={24} color="black" />
            </TouchableOpacity>
          ) : (
            <PaperSearchbar
              ref={searchBarRef}
              style={styles.searchBar}
              placeholder="Search posts"
              value={search}
              onChangeText={searchFilterFunction}
              onBlur={() => !search && setShowSearchBar(false)}
            />
          )}
        </View>
        {/* TABS */}
        <View style={styles.tabContainer}>
          {['Posts', 'Members', 'Reviews'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
         {/* TAB CONTENT */}
         {loading ? (
          <ActivityIndicator size="large" color="#6ba32d" />
        ) : (
          <>
            {activeTab === 'Posts' && (
              <FlatList
                data={filteredDataSource}
                keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
                renderItem={renderPost}
                contentContainerStyle={styles.listContainer}
              />
            )}
            {activeTab === 'Members' && renderMembers()}
            {activeTab === 'Reviews' && renderReviews()}
          </>
        )}
   </View>
   </ScrollView>
</View>
  );
};


const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f9f9f9' },
  headerContainer: { backgroundColor: '#fff', marginBottom: 10 },
  bannerImage: { width: width, height: 150 },
  headerContent: { padding: 10 },
  cliqueName: { fontSize: 22, fontWeight: 'bold' },
  memberCount: { fontSize: 14, color: '#666', marginBottom: 5 },
  description: { fontSize: 14, color: '#444', marginBottom: 10 },
  joinButton: { backgroundColor: '#007bff', padding: 10, borderRadius: 8, alignSelf: 'flex-start' },
  joinButtonText: { color: '#fff', fontWeight: 'bold' },
  feedback: { marginTop: 5, color: 'red' },
  searchWrapper: { paddingHorizontal: 10, marginBottom: 5 },
  searchBar: { backgroundColor: '#eee' },
  searchIcon: { alignSelf: 'flex-end', margin: 5 },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', paddingVertical: 10 },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#007bff' },
  tabText: { fontSize: 16, color: '#666' },
  activeTabText: { color: '#007bff', fontWeight: 'bold' },
  listContainer: { padding: 10 },
  cardContainer: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  author: { fontSize: 14, fontWeight: 'bold' },
  caption: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  placeholderContainer: { padding: 20, alignItems: 'center' },
  placeholderText: { fontSize: 16, color: '#666' }
});


export default Clique;
