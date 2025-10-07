import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { postsService } from '../services';
import { showError } from '../store/app.store';
import { useAuthStore } from '../store/auth.store';
import { Post, ScreenNavigationProp } from '../types';
import { PrimaryButton, ScreenHeader, PostItem } from '../components';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp<'Home'>>();
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

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="newspaper-o" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Posts Yet</Text>
      <Text style={styles.emptyText}>
        Follow cliques to see posts in your feed
      </Text>
      <PrimaryButton
        title="Explore Cliques"
        onPress={() => navigation.navigate('CliquesTab')}
        style={{ marginHorizontal: 0, width: '100%', marginTop: 24 }}
      />
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
        <PrimaryButton
          title="Sign In"
          onPress={() => navigation.navigate('SignIn')}
          style={{ marginHorizontal: 0, width: '100%', marginTop: 24 }}
        />
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
      <ScreenHeader title="Home Feed" showBackButton={false} />

      {/* Posts List */}
      {posts.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PostItem post={item} />}
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
  },
  listContent: {
    paddingVertical: 16,
  },
});

export default HomeScreen;
