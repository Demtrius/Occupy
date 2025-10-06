import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { postsService } from '../services';
import { showError } from '@store/app.store';
import { Post } from '../types';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  PostDetail: { id: number };
  SearchTab: { screen: string; params: { id: number } };
  CliquesTab: { screen: string; params: { id: number } };
};

type PostItemNavigationProp = StackNavigationProp<RootStackParamList>;

const PostItem: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const navigation = useNavigation<PostItemNavigationProp>();

  useEffect(() => {
    getPosts();
  }, []);

  const getPosts = async () => {
    try {
      setLoading(true);
      const data = await postsService.getFeedPosts();
      setPosts(data);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      showError(error.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await getPosts();
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetail', { id: post.id });
  };

  const handleUserPress = (userId: number) => {
    (navigation as any).navigate('SearchTab', {
      screen: 'ViewUser',
      params: { id: userId },
    });
  };

  const handleCliquePress = (cliqueId: number) => {
    (navigation as any).navigate('CliquesTab', {
      screen: 'Clique',
      params: { id: cliqueId },
    });
  };

  const renderPosts = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.container}
      onPress={() => handlePostPress(item)}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        onPress={() => handleUserPress(item.userId)}
        activeOpacity={0.7}
      >
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#9CA3AF" />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => handleUserPress(item.userId)}>
            <Text style={styles.name}>{item.occupier || 'Unknown User'}</Text>
          </TouchableOpacity>
          <View style={styles.metaContainer}>
            {item.clique && (
              <>
                <TouchableOpacity onPress={() => handleCliquePress(item.cliqueId)}>
                  <Text style={styles.clique}>@{item.clique}</Text>
                </TouchableOpacity>
                <Text style={styles.separator}> · </Text>
              </>
            )}
            <Text style={styles.timestamp}>{item.posted || 'Just now'}</Text>
          </View>
        </View>

        {item.caption && (
          <Text style={styles.caption} numberOfLines={3}>
            {item.caption}
          </Text>
        )}

        {item.content && item.content !== item.caption && (
          <Text style={styles.content} numberOfLines={2}>
            {item.content}
          </Text>
        )}

        <View style={styles.engagement}>
          <TouchableOpacity style={styles.engagementButton}>
            <FontAwesome name="comment-o" size={16} color="#6B7280" />
            <Text style={styles.engagementText}>
              {item.commentsCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.engagementButton}>
            <FontAwesome name="heart-o" size={16} color="#6B7280" />
            <Text style={styles.engagementText}>
              {item.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.engagementButton}>
            <FontAwesome name="share" size={16} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.engagementButton}>
            <FontAwesome name="bookmark-o" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyText}>No posts available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getPosts}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPosts}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6ba32d"
            colors={['#6ba32d']}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: height * 0.08,
  },
  listContent: {
    paddingVertical: 8,
  },
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#ffffff',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  clique: {
    fontSize: 14,
    color: '#6ba32d',
    fontWeight: '500',
  },
  separator: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  timestamp: {
    fontSize: 14,
    color: '#6B7280',
  },
  caption: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 6,
  },
  content: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  engagement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 4,
  },
  engagementText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6ba32d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PostItem;
