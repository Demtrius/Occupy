import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Entypo, FontAwesome } from '@expo/vector-icons';
import { postsService } from '../services';
import { showError } from '../store/app.store';
import { Post } from '../types';

const Home: React.FC = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch posts
  const getPosts = async () => {
    try {
      const data = await postsService.getFeedPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await getPosts();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    getPosts();
  }, []);

  // Navigate to post detail
  const navigateToPostDetail = (postId: number) => {
    navigation.navigate('PostDetail' as never, { id: postId } as never);
  };

  // Icon button component
  const IconButton: React.FC<{ count?: number }> = ({ count = 0 }) => {
    return (
      <View style={styles.iconButton}>
        <FontAwesome name="comment-o" size={22} color="black" />
        <Text style={styles.iconCount}> {count} </Text>
      </View>
    );
  };

  // Render post item
  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postContainer}
      onPress={() => navigateToPostDetail(item.id)}
    >
      <View style={styles.postHeader}>
        <Text style={styles.cliqueName}>{item.clique || 'General'}</Text>
        <Entypo
          name="dots-three-horizontal"
          size={16}
          color="grey"
          style={styles.menuIcon}
        />
      </View>

      <View style={styles.mainContainer}>
        <Text style={styles.username}>{item.occupier}</Text>
        <Text style={styles.content}>{item.content}</Text>
        <Text style={styles.posted}>{item.posted}</Text>
        <Text style={styles.caption}>{item.caption}</Text>

        <View style={styles.footer}>
          <IconButton count={item.commentsCount || 0} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts available</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  listContent: {
    paddingTop: 50,
  },
  postContainer: {
    padding: 10,
    borderColor: 'lightgrey',
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#fff',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cliqueName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  menuIcon: {
    marginLeft: 'auto',
  },
  mainContainer: {
    marginLeft: 10,
  },
  username: {
    fontSize: 14,
    color: '#6ba32d',
    fontWeight: '600',
    marginBottom: 5,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 10,
  },
  posted: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  caption: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    marginVertical: 5,
    justifyContent: 'flex-start',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCount: {
    fontSize: 12,
    color: '#666',
  },
});

export default Home;
