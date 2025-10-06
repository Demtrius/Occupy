import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Searchbar, Button } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';
import { postsService, cliquesService } from '../services';
import { showError } from '@store/app.store';
import { Post, Clique } from '../types';
import { useDebounce } from '../hooks';

const { width, height } = Dimensions.get('window');

const Feed: React.FC = () => {
  const navigation = useNavigation();

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsClique, setPostClique] = useState<Clique | null>(null);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [cliques, setCliques] = useState<Clique[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [search, setSearch] = useState<string>('');
  const [filteredDataSource, setFilteredDataSource] = useState<Post[]>([]);
  const [category, setCategory] = useState<number | 'all'>('all');

  const [nearYouPosts, setNearYouPosts] = useState<Post[]>([]);

  const debouncedSearch = useDebounce(search, 500);

  // Fetch cliques
  const getCliques = async () => {
    try {
      const data = await cliquesService.getAllCliques();
      setCliques(data);
    } catch (error) {
      console.error('Error fetching cliques:', error);
      showError('Failed to load cliques');
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts
  const getPosts = async () => {
    try {
      const data = await postsService.getFeedPosts();
      setPosts(data);
      setFilteredDataSource(data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching posts:', error);
      showError('Failed to load posts');
    }
  };

  // Fetch posts for "near you" section
  const getPostsHorizontal = async () => {
    try {
      const data = await postsService.getFeedPosts();
      setNearYouPosts(data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching near you posts:', error);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([getCliques(), getPosts(), getPostsHorizontal()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    getCliques();
    getPosts();
    getPostsHorizontal();
  }, []);

  // Fetch clique details when post is selected
  useEffect(() => {
    const fetchCliqueDetails = async () => {
      if (selectedPost && selectedPost.cliqueId) {
        try {
          const clique = await cliquesService.getCliqueById(selectedPost.cliqueId);
          setPostClique(clique);
        } catch (error) {
          console.error('Error fetching clique:', error);
        }
      }
    };

    fetchCliqueDetails();
  }, [selectedPost]);

  // Search filter with debounce
  useEffect(() => {
    if (debouncedSearch) {
      const filtered = posts.filter((item) => {
        const itemData = item.caption ? item.caption.toUpperCase() : '';
        return itemData.includes(debouncedSearch.toUpperCase());
      });
      setFilteredDataSource(filtered.slice(0, 3));
    } else {
      filterByCategory(category);
    }
  }, [debouncedSearch, category]);

  // Filter by category
  const filterByCategory = (selectedCategory: number | 'all') => {
    setCategory(selectedCategory);
    if (selectedCategory === 'all') {
      setFilteredDataSource(posts.slice(0, 3));
    } else {
      const filtered = posts.filter((item) => item.cliqueId === selectedCategory);
      setFilteredDataSource(filtered.slice(0, 3));
    }
  };

  // Modal handlers
  const openModal = (post: Post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPost(null);
    setPostClique(null);
  };

  // Navigate to clique
  const navigateToClique = (cliqueId: number) => {
    closeModal();
    navigation.navigate('CliquesTab' as never, {
      screen: 'Clique',
      params: { id: cliqueId },
    } as never);
  };

  // Navigate to user profile
  const navigateToUser = (userId: number) => {
    closeModal();
    navigation.navigate('SearchTab' as never, {
      screen: 'ViewUser',
      params: { id: userId },
    } as never);
  };

  // Navigate to messages
  const navigateToMessages = (userId: number) => {
    closeModal();
    navigation.navigate('NotificationsTab' as never, {
      screen: 'MessageDetail',
      params: { id: userId },
    } as never);
  };

  // Render post item
  const renderPosts = ({ item }: { item: Post }) => {
    const cliqueName = cliques.find((clique) => clique.id === item.cliqueId)?.name || 'Unknown Clique';

    return (
      <View style={styles.postContainer}>
        <TouchableOpacity style={styles.postTouchable} onPress={() => openModal(item)}>
          {item.avatar && (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          )}
          <View style={styles.contentContainer}>
            <View style={styles.header}>
              <Text style={styles.name}>{item.occupier}</Text>
              <Text style={styles.handle}>
                @{item.clique} · {item.posted}
              </Text>
            </View>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.caption}>{item.caption}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Render near you posts
  const renderNearYou = ({ item }: { item: Post }) => {
    const cliqueName = cliques.find((clique) => clique.id === item.cliqueId)?.name || 'Unknown Clique';

    return (
      <TouchableOpacity
        style={styles.nearYouCard}
        onPress={() => openModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: item.avatar || 'https://via.placeholder.com/300x200' }}
            style={styles.cardImage}
          />
          <Text style={styles.dateBadge}>{item.posted || 'Recent'}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.caption}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{cliqueName}</Text>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={(e) => {
            e.stopPropagation();
            navigateToMessages(item.userId);
          }}
        >
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        style={styles.searchBar}
        placeholder="Search"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <Button
            mode={category === 'all' ? 'contained' : 'outlined'}
            onPress={() => filterByCategory('all')}
            color="#6ba32d"
            contentStyle={styles.buttonContent}
            style={styles.button}
          >
            All
          </Button>
          {cliques.map((clique) => (
            <Button
              key={clique.id}
              mode={category === clique.id ? 'contained' : 'outlined'}
              onPress={() => filterByCategory(clique.id)}
              color="#6ba32d"
              contentStyle={styles.buttonContent}
              style={styles.button}
            >
              {clique.name}
            </Button>
          ))}
        </ScrollView>
      </View>

      <Text style={[styles.sectionTitle, { marginLeft: width * 0.04, marginTop: height * 0.02 }]}>
        Posts for you
      </Text>

      {filteredDataSource.length === 0 ? (
        <Text style={styles.noPostsText}>No posts available</Text>
      ) : (
        <FlatList
          data={filteredDataSource}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPosts}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          style={{ flexGrow: 0 }}
        />
      )}

      <View style={styles.nearYouSection}>
        <Text style={[styles.sectionTitle, { marginLeft: width * 0.04, marginBottom: 8 }]}>Near you</Text>
        <FlatList
          horizontal
          data={nearYouPosts}
          keyExtractor={(item) => `near-${item.id}`}
          renderItem={renderNearYou}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearYouContainer}
          style={styles.nearYouList}
        />
      </View>

      {/* Post Detail Modal */}
      {selectedPost && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={closeModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={[styles.modalButton, styles.greenButton, styles.closeButton]}
                onPress={closeModal}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { textAlign: 'center', flex: 1 }]}>Occupy</Text>
            </View>
            <Text style={styles.modalText1}>@{postsClique?.name || 'Loading...'}</Text>
            <Text style={styles.modalText}>{selectedPost.content}</Text>
            <Text style={styles.modalText}>{selectedPost.caption}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.greenButton]}
              onPress={() => navigateToClique(selectedPost.cliqueId)}
            >
              <Text style={styles.modalButtonText}>Go to clique</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.greenButton]}
              onPress={() => navigateToUser(selectedPost.userId)}
            >
              <Text style={styles.modalButtonText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.greenButton]}
              onPress={() => navigateToMessages(selectedPost.userId)}
            >
              <Text style={styles.modalButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: height * 0.08,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  searchBar: {
    marginHorizontal: width * 0.04,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: height * 0.01,
    paddingHorizontal: width * 0.01,
  },
  scrollViewContent: {
    paddingHorizontal: width * 0.04,
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 0,
    marginRight: 10,
  },
  buttonContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 1,
  },
  noPostsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,
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
    marginHorizontal: width * 0.04,
    padding: 16,
  },
  postTouchable: {
    flexDirection: 'row',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  handle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: '#6B7280',
  },
  nearYouSection: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    paddingBottom: 20,
  },
  nearYouContainer: {
    paddingHorizontal: width * 0.04,
  },
  nearYouList: {
    maxHeight: 200,
  },
  nearYouCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    marginRight: 16,
    width: width * 0.4,
    padding: 16,
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
  dateBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6ba32d',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  contactButton: {
    borderWidth: 1,
    borderColor: '#6ba32d',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 14,
    color: '#6ba32d',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    marginTop: -150,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 2,
    marginLeft: -60,
  },
  modalText1: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 10,
  },
  modalButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
  },
  greenButton: {
    backgroundColor: '#6ba32d',
  },
  closeButton: {
    width: 'auto',
    paddingHorizontal: 15,
    zIndex: 1,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Feed;
