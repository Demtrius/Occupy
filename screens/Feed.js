import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Modal, ScrollView, Image, Dimensions, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Searchbar, Button } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

function Feed() {
  const [posts, setPosts] = useState([]);
  const [postsClique, setPostClique] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const navigation = useNavigation();

  const [cliques, setCliques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [category, setCategory] = useState('all');

  const [nearYouPosts, setNearYouPosts] = useState([]);

  const getCliques = () => {
    axios.get(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/cliques-list')
      .then((response) => {
        const myCliques = response.data;
        setCliques(myCliques);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        setLoading(false);
      });
  };

  const getPosts = () => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/post-list')
      .then((response) => response.json())
      .then((data) => {
        setPosts(data);
        setFilteredDataSource(data.slice(0, 3)); // Limit to 3 posts
      })
      .catch((error) => console.error('Error fetching posts:', error));
  };

  const getPostshorizontal = () => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/post-list')
      .then((response) => response.json())
      .then((data) => {
        setNearYouPosts(data.slice(0, 5)); // Limit to 5 near you posts
      })
      .catch((error) => console.error('Error fetching posts:', error));
  };

  const onRefresh = () => {
    setRefreshing(true);
    getCliques();
    getPosts();
    getPostshorizontal();
    setRefreshing(false);
  };

  useEffect(() => {
    getCliques();
    getPosts();
    getPostshorizontal();
  }, []);

  const openModal = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPost(null);
  };

  useEffect(() => {
    if (selectedPost) {
      axios
        .get(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/cliques/' + selectedPost.clique_id)
        .then((response) => {
          setPostClique(response.data);
        })
        .catch((error) => console.error(error));
    }
  }, [selectedPost]);

  const searchFilterFunction = (text) => {
    if (text) {
      const newData = posts.filter((item) => {
        const itemData = item.caption ? item.caption.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredDataSource(newData.slice(0, 3)); // Limit to 3 posts
      setSearch(text);
    } else {
      filterByCategory(category);
      setSearch(text);
    }
  };

  const filterByCategory = (category) => {
    setCategory(category);
    if (category === 'all') {
      setFilteredDataSource(posts.slice(0, 3)); // Limit to 3 posts
    } else {
      const newData = posts.filter((item) => item.clique_id === category);
      setFilteredDataSource(newData.slice(0, 3)); // Limit to 3 posts
    }
  };

  const renderPosts = ({ item }) => {
    const cliqueName = cliques.find(clique => clique.id === item.clique_id)?.name || 'Unknown Clique';
    return (
      <View style={styles.postContainer}>
        <TouchableOpacity
          style={styles.postTouchable}
          onPress={() => openModal(item)}>
          <View style={styles.postHeader}>
            <Image source={{ uri: 'https://placecats.com/300/200' }} style={styles.postImage} />
            <View>
              <Text style={styles.postTitle}>{item.caption}</Text>
              <Text style={styles.postSubtitle}>{cliqueName}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderNearYou = ({ item }) => {
    const cliqueName = cliques.find(clique => clique.id === item.clique_id)?.name || 'Unknown Clique';
    return (
      <View style={styles.nearYouCard}>
        <TouchableOpacity
          style={styles.postTouchable}
          onPress={() => openModal(item)}>
          <View style={styles.cardHeader}>
            <Image source={{ uri: 'https://placecats.com/300/200' }} style={styles.cardImage} />
            <Text style={styles.dateBadge}>MAR 05</Text>
          </View>
          <Text style={styles.cardTitle}>{item.caption}</Text>
          <Text style={styles.cardSubtitle}>{cliqueName}</Text>
          <TouchableOpacity style={styles.contactButton} onPress={() => {closeModal(); navigation.navigate('NotificationsTab', { screen: 'MessageDetail', params: { id: item.user_id}}) }}>
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        style={styles.searchBar}
        placeholder="Search"
        value={search}
        onChangeText={(text) => searchFilterFunction(text)}
      />
      <View style={styles.categoryContainer}>
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        <Button
          mode={category === 'all' ? 'contained' : 'outlined'}
          onPress={() => filterByCategory('all')}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          <Text>All</Text>
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
            <Text>{clique.name}</Text>
          </Button>
        ))}
          </ScrollView>
      </View>

      <Text style={[styles.sectionTitle, { marginLeft: width * 0.04, marginTop: height * 0.02 }]}>Posts for you</Text>

      {filteredDataSource.length === 0 ? (
        <Text style={styles.noPostsText}>No posts available</Text>
      ) : (
        <FlatList
          data={filteredDataSource}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderPosts}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={{ flexGrow: 0 }} // Prevent FlatList from growing
        />
      )}

      <View style={styles.nearYouSection}>
        <Text style={[styles.sectionTitle, { marginLeft: width * 0.04 }]}>Near you</Text>
        <FlatList
          horizontal
          data={nearYouPosts}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderNearYou}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearYouContainer}
          style={styles.nearYouList} // Set fixed height for Near you container and fix to bottom
        />
      </View>

      {selectedPost && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={closeModal}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={[styles.modalButton, styles.greenButton, styles.closeButton]} onPress={closeModal}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { textAlign: 'center', flex: 1 }]}>Post Details</Text>
            </View>
            <Image source={{ uri: 'https://placecats.com/300/200' }} style={styles.modalImage} />
            <Text style={styles.modalText}>Caption: {selectedPost.caption}</Text>
            <Text style={styles.modalText}>Content: {selectedPost.content}</Text>
            <Text style={styles.modalText}>Clique: {postsClique.name}</Text>
            <TouchableOpacity style={[styles.modalButton, styles.greenButton]} onPress={() => {closeModal(); navigation.navigate('CliquesTab', { screen: 'Clique', params: { id: selectedPost.clique_id}}) }}>
              <Text style={styles.modalButtonText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.greenButton]} onPress={() => {closeModal(); navigation.navigate('SearchTab', { screen: 'ViewUser', params: { id: selectedPost.user_id}}) }}>
              <Text style={styles.modalButtonText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.greenButton]} onPress={() => {closeModal(); navigation.navigate('NotificationsTab', { screen: 'MessageDetail', params: { id: selectedPost.user_id}}) }}>
              <Text style={styles.modalButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: height * 0.08, // Add padding to avoid content getting under the dynamic island
  },
  searchBar: {
    marginHorizontal: width * 0.04,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  listContainer: {
    paddingHorizontal: width * 0.01,
    paddingTop: height * 0.01,
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: width * 0.04,
    marginBottom: height * 0.01,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // For Android shadow
  },
  itemText: {
    fontSize: width * 0.04,
    color: '#333333',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: height * 0.01,
    paddingHorizontal: width * 0.01,
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 0, // Add padding to the sides
    marginRight: 10, // Add margin to the right for spacing
  },
  buttonContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  itemsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: width * 0.04,
    marginTop: height * 0.02,
  },
  itemType: {
    fontSize: 14,
    color: 'grey',
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
  nearYouCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    maxHeight: 200,
  },
  nearYouContainer: {
    flexDirection: 'row',
    marginBottom: 16,
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
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
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
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  postSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
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
    marginLeft:-60,
  },
  modalText: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 10,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
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
    zIndex: 1, // Ensure the close button is on top
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Feed;