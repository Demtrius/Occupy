import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Image, ScrollView } from 'react-native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Context, GlobalContextType } from '../components/globalContext/globalContext';
import { StackNavigationProp } from '@react-navigation/stack';

const { width, height } = Dimensions.get('window');

// Types
interface Post {
  id: number;
  profile_image?: string;
  username?: string;
  caption?: string;
  content?: string;
  user_id: number;
}

interface CliqueInfo {
  name: string;
  description: string;
  created_at: string;
  banner?: string;
  members: number;
  posts?: Post[];
}

type RootStackParamList = {
  Clique: { id: number };
  NotificationsTab: { screen: string, params: { id: number } };
};

type CliqueScreenRouteProp = RouteProp<RootStackParamList, 'Clique'>;
type CliqueScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NotificationsTab'>;

interface Props {
  route: CliqueScreenRouteProp;
}

const Clique: React.FC<Props> = ({ route }) => {
  const [clique, setClique] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'Posts' | 'Members' | 'Reviews'>('Posts');
  const [search, setSearch] = useState<string>('');
  const [filteredDataSource, setFilteredDataSource] = useState<Post[]>([]);
  const [masterDataSource, setMasterDataSource] = useState<Post[]>([]);
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const searchBarRef = useRef<PaperSearchbar>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [cliqueName, setCliqueName] = useState<string>('');
  const [cliqueInfo, setCliqueInfo] = useState<Partial<CliqueInfo>>({});
  const navigation = useNavigation<CliqueScreenNavigationProp>();
  const globalContext = useContext<GlobalContextType | null>(Context);
  const { occupierObj } = globalContext || {};
  const [isMember, setIsMember] = useState<boolean>(false);

  const { id } = route.params;

  const getClique = () => {
    axios
      .get<CliqueInfo>(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/${id}/posts`)
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

  const joinClique = () => {
    if (!occupierObj?.token) {
      setFeedbackMessage('You must be logged in to join a clique');
      return;
    }
    axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/cliques-join/`, {
      clique_id: id
    }, {
      headers: {
        'Authorization': 'Bearer ' + occupierObj.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
      .then(() => {
        setIsFollowing(!isFollowing);
      })
      .catch(() => {
        setFeedbackMessage('Failed to join clique');
      });
  };

  useEffect(() => {
    getClique();
  }, [id]);

  const searchFilterFunction = (text: string) => {
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

  const renderPost = ({ item }: { item: Post }) => (
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

  const renderReviews = () => (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>Reviews coming soon...</Text>
    </View>
  );

  const renderMembers = () => (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>Members list coming soon...</Text>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
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

          <View style={styles.tabContainer}>
            {['Posts', 'Members', 'Reviews'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab as 'Posts' | 'Members' | 'Reviews')}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
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
