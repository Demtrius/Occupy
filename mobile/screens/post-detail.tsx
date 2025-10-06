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
  TextInput,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { postsService, cliquesService, socialService } from '../services';
import { showError, showSuccess } from '@store/app.store';
import { Post, Clique, Comment } from '../types';
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [likingPost, setLikingPost] = useState<boolean>(false);
  const [showFeatureNotice, setShowFeatureNotice] = useState<boolean>(false);

  const { id } = route.params;

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError('');
      const postData = await postsService.getPostById(id);
      setPost(postData);
      setIsLiked(postData.isLiked || false);
      setLikesCount(postData.likesCount || 0);

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

  const fetchComments = async () => {
    try {
      const commentsData = await socialService.getPostComments(id);
      setComments(commentsData);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      // Don't break the UI if comments endpoint doesn't exist yet
      setComments([]);
    }
  };

  const handleLike = async () => {
    if (likingPost) return;

    try {
      setLikingPost(true);
      if (isLiked) {
        await socialService.unlikePost(id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await socialService.likePost(id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error liking post:', error);
      // Don't show error if endpoint doesn't exist yet (404)
      if (error.status !== 404) {
        showError(error.message || 'Failed to like post');
      } else {
        console.log('Like feature endpoint not available yet');
        setShowFeatureNotice(true);
      }
    } finally {
      setLikingPost(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const comment = await socialService.createComment({
        postId: id,
        content: commentText.trim(),
      });
      setComments([...comments, comment]);
      setCommentText('');
      showSuccess('Comment added!');
      // Refresh comments to get updated list
      await fetchComments();
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      if (error.status === 404) {
        setShowFeatureNotice(true);
      }
      showError(error.message || 'Comments feature coming soon!');
    } finally {
      setSubmittingComment(false);
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
                {post.occupier?.username || 'Unknown User'}
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
        <TouchableOpacity style={styles.actionButton} onPress={handleLike} disabled={likingPost}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#ff6b6b" : "#6ba32d"}
          />
          <Text style={styles.actionText}>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#6ba32d" />
          <Text style={styles.actionText}>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</Text>
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

      {/* Feature Notice */}
      {showFeatureNotice && (
        <View style={styles.featureNotice}>
          <Ionicons name="information-circle" size={20} color="#FFA500" />
          <Text style={styles.featureNoticeText}>
            Social features (likes & comments) are being set up on the backend.
          </Text>
        </View>
      )}

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsSectionTitle}>Comments</Text>
        {comments.length === 0 ? (
          <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
        ) : (
          comments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUsername}>
                  {comment.user?.username || 'Anonymous'}
                </Text>
                <Text style={styles.commentDate}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.commentContent}>{comment.content}</Text>
            </View>
          ))
        )}
      </View>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          placeholderTextColor="#999"
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.commentSubmitButton,
            (!commentText.trim() || submittingComment) && styles.commentSubmitButtonDisabled
          ]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submittingComment}
        >
          {submittingComment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  noComments: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
  },
  commentSubmitButton: {
    backgroundColor: '#6ba32d',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  actionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  featureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbea',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFA500',
  },
  featureNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
