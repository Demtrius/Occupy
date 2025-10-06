import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { postsService, cliquesService } from '../services';
import { showError } from '@store/app.store';
import { Post, Clique } from '../types';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Types
type RootStackParamList = {
  PostDetail: { id: number };
  CliquesTab: { screen: string; params: { id: number } };
  SearchTab: { screen: string; params: { id: number } };
};

type PostDetailScreenRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;
type PostDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  route: PostDetailScreenRouteProp;
}

const PostDetail: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<PostDetailScreenNavigationProp>();
  const [post, setPost] = useState<Post | null>(null);
  const [clique, setClique] = useState<Clique | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const { id } = route.params;

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError('');
      const postData = await postsService.getPostById(id);
      setPost(postData);

      // Fetch clique details if available
      if (postData.cliqueId) {
        try {
          const cliqueData = await cliquesService.getCliqueById(postData.cliqueId);
          setClique(cliqueData);
        } catch (err) {
          console.error('Error fetching clique:', err);
        }
      }
    } catch (err: any) {
      console.error('Error fetching post:', err);
      setError(err.message || 'Failed to load post');
      showError(err.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const navigateToClique = () => {
    if (post?.cliqueId) {
      (navigation as any).navigate('CliquesTab', {
        screen: 'Clique',
        params: { id: post.cliqueId },
      });
    }
  };

  const navigateToUser = () => {
    if (post?.userId) {
      (navigation as any).navigate('SearchTab', {
        screen: 'ViewUser',
        params: { id: post.userId },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>{error || 'Post not found'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchPost}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {post.avatar && (
            <Image source={{ uri: post.avatar }} style={styles.avatar} />
          )}
          {!post.avatar && (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#9CA3AF" />
            </View>
          )}
          <View style={styles.userDetails}>
            <TouchableOpacity onPress={navigateToUser}>
              <Text style={styles.username}>
                {post.occupier || 'Unknown User'}
              </Text>
            </TouchableOpacity>
            {clique && (
              <TouchableOpacity onPress={navigateToClique}>
                <Text style={styles.cliqueName}>@{clique.name}</Text>
              </TouchableOpacity>
            )}
            {post.posted && (
              <Text style={styles.timestamp}>{post.posted}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.postBody}>
        {post.caption && (
          <Text style={styles.caption}>{post.caption}</Text>
        )}
        {post.content && post.content !== post.caption && (
          <Text style={styles.content}>{post.content}</Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Ionicons name="heart-outline" size={20} color="#6B7280" />
          <Text style={styles.statText}>{post.likesCount || 0} likes</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text style={styles.statText}>{post.commentsCount || 0} comments</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={24} color="#6ba32d" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#6ba32d" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color="#6ba32d" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {clique && (
        <View style={styles.cliqueCard}>
          <Text style={styles.cliqueCardTitle}>Posted in</Text>
          <TouchableOpacity
            style={styles.cliqueCardContent}
            onPress={navigateToClique}
          >
            <Text style={styles.cliqueCardName}>{clique.name}</Text>
            {clique.description && (
              <Text style={styles.cliqueCardDescription} numberOfLines={2}>
                {clique.description}
              </Text>
            )}
            <View style={styles.cliqueCardMeta}>
              <Ionicons name="people" size={16} color="#6B7280" />
              <Text style={styles.cliqueCardMetaText}>
                {clique.membersCount || 0} members
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    paddingTop: height * 0.08,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cliqueName: {
    fontSize: 14,
    color: '#6ba32d',
    fontWeight: '500',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 14,
    color: '#6B7280',
  },
  postBody: {
    padding: 16,
  },
  caption: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 24,
  },
  content: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#6ba32d',
    fontWeight: '600',
    marginLeft: 6,
  },
  cliqueCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cliqueCardTitle: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 8,
  },
  cliqueCardContent: {
    paddingTop: 8,
  },
  cliqueCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  cliqueCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  cliqueCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cliqueCardMetaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
});

export default PostDetail;
