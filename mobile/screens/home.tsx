import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Entypo, FontAwesome } from '@expo/vector-icons';
import { postsService } from '../services';
import { showError } from '../store/app.store';
import { useAuthStore } from '../store/auth.store';
import { Post } from '../types';

const Home: React.FC = () => {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

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
      showError('Failed to load posts. Please try again.');
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
    if (isLoggedIn) {
      getPosts();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Navigate to post detail
  const navigateToPostDetail = (postId: number) => {
    navigation.navigate('PostDetail' as never, { id: postId } as never);
  };

  // Navigate to clique
  const navigateToClique = (cliqueName: string) => {
    navigation.navigate('CliquesTab' as never);
  };

  // Navigate to user profile
  const navigateToProfile = (username: string) => {
    navigation.navigate('Profile' as never);
  };

  // Icon button component
  const IconButton: React.FC<{ count?: number; onPress?: () => void }> = ({
    count = 0,
    onPress,
  }) => {
    return (
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <FontAwesome name="comment-o" size={22} color="#6ba32d" />
        <Text style={styles.iconCount}> {count} </Text>
      </TouchableOpacity>
    );
  };

  // Render post item
  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postContainer}
      onPress={() => navigateToPostDetail(item.id)}
      activeOpacity={0.95}
    >
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          onPress={() => navigateToClique(item.clique || '')}
          style={styles.cliqueButton}
        >
          <Text style={styles.cliqueName}>{item.clique || 'General'}</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Entypo name="dots-three-horizontal" size={16} color="grey" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.mainContainer}>
        <TouchableOpacity onPress={() => navigateToProfile(item.occupier)}>
          <Text style={styles.username}>@{item.occupier}</Text>
        </TouchableOpacity>

        <Text style={styles.content} numberOfLines={5}>
          {item.content}
        </Text>

        {item.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        )}

        <Text style={styles.posted}>{item.posted}</Text>

        {/* Post Footer */}
        <View style={styles.footer}>
          <IconButton
            count={item.commentsCount || 0}
            onPress={() => navigateToPostDetail(item.id)}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="newspaper-o" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Posts Yet</Text>
      <Text style={styles.emptyText}>
        Follow cliques to see posts in your feed
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('CliquesTab' as never)}
      >
        <Text style={styles.exploreButtonText}>Explore Cliques</Text>
      </TouchableOpacity>
    </View>
  );

  // Not logged in state
  if (!isLoggedIn) {
    return (
      <View style={styles.notLoggedInContainer}>
        <FontAwesome name="lock" size={64} color="#ccc" />
        <Text style={styles.notLoggedInTitle}>Please Sign In</Text>
        <Text style={styles.notLoggedInText}>
          Sign in to see your personalized feed
        </Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => navigation.navigate('SignIn' as never)}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
        <Text style={styles.loadingText}>Loading your feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home Feed</Text>
        {user && (
          <Text style={styles.headerSubtitle}>Welcome, {user.username}!</Text>
        )}
      </View>

      {/* Posts List */}
      {posts.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6ba32d']}
              tintColor="#6ba32d"
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 32,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  notLoggedInText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#6ba32d',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#6ba32d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 16,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cliqueButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cliqueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6ba32d',
  },
  mainContainer: {
    marginTop: 4,
  },
  username: {
    fontSize: 14,
    color: '#6ba32d',
    fontWeight: '600',
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  posted: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  iconCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
});

export default Home;
