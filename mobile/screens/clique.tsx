import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { cliquesService, postsService } from '../services';
import { showError, showSuccess } from '../store/app.store';
import { useAuthStore } from '../store/auth.store';
import { Clique, Post } from '../types';
import { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');

type CliqueScreenRouteProp = RouteProp<RootStackParamList, 'Clique'>;
type CliqueScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  route: CliqueScreenRouteProp;
}

type TabType = 'Posts' | 'Members' | 'Reviews';

const CliqueScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<CliqueScreenNavigationProp>();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const { id } = route.params;

  const [clique, setClique] = useState<Clique | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('Posts');
  const [search, setSearch] = useState<string>('');
  const [isMember, setIsMember] = useState<boolean>(false);
  const [joiningClique, setJoiningClique] = useState<boolean>(false);

  // Fetch clique details
  const fetchCliqueDetails = async () => {
    try {
      const cliqueData = await cliquesService.getCliqueById(id);
      setClique(cliqueData);

      // Check if current user is a member
      if (user && cliqueData.members) {
        setIsMember(cliqueData.members.includes(user.id));
      }
    } catch (error) {
      console.error('Error fetching clique:', error);
      showError('Failed to load clique details');
    }
  };

  // Fetch clique posts
  const fetchCliquePosts = async () => {
    try {
      const postsData = await cliquesService.getCliquePosts(id);
      setPosts(postsData);
      setFilteredPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCliqueDetails(), fetchCliquePosts()]);
    };
    loadData();
  }, [id]);

  // Search filter
  useEffect(() => {
    if (search.trim()) {
      const filtered = posts.filter((post) => {
        const content = post.content?.toLowerCase() || '';
        const caption = post.caption?.toLowerCase() || '';
        const searchTerm = search.toLowerCase();
        return content.includes(searchTerm) || caption.includes(searchTerm);
      });
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(posts);
    }
  }, [search, posts]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchCliqueDetails(), fetchCliquePosts()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Join/Leave clique
  const handleJoinLeave = async () => {
    if (!isLoggedIn || !user) {
      showError('You must be logged in to join a clique');
      navigation.navigate('SignIn' as never);
      return;
    }

    setJoiningClique(true);
    try {
      if (isMember) {
        await cliquesService.leaveClique(id);
        setIsMember(false);
        showSuccess('Left clique successfully');
      } else {
        await cliquesService.joinClique(id);
        setIsMember(true);
        showSuccess('Joined clique successfully!');
      }
      // Refresh clique details to update member count
      await fetchCliqueDetails();
    } catch (error: any) {
      console.error('Error joining/leaving clique:', error);
      showError(error.message || 'Failed to update membership');
    } finally {
      setJoiningClique(false);
    }
  };

  // Navigate to post detail
  const navigateToPostDetail = (postId: number) => {
    navigation.navigate('PostDetail' as never, { id: postId } as never);
  };

  // Navigate to user profile
  const navigateToUserProfile = (username: string) => {
    navigation.navigate('ViewUser' as never, { username } as never);
  };

  // Render post item
  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigateToPostDetail(item.id)}
      activeOpacity={0.9}
    >
      <View style={styles.postHeader}>
        <TouchableOpacity
          onPress={() => navigateToUserProfile(item.occupier)}
          style={styles.authorSection}
        >
          <Image
            source={{
              uri: item.profileImage || 'https://www.gravatar.com/avatar/?d=mp',
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.authorName}>@{item.occupier}</Text>
            <Text style={styles.postDate}>{item.posted}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.postContent} numberOfLines={4}>
        {item.content}
      </Text>

      {item.caption && (
        <Text style={styles.postCaption} numberOfLines={2}>
          {item.caption}
        </Text>
      )}

      <View style={styles.postFooter}>
        <View style={styles.iconGroup}>
          <FontAwesome name="comment-o" size={18} color="#666" />
          <Text style={styles.iconText}>{item.commentsCount || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = (message: string) => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="inbox" size={64} color="#ccc" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  // Render members tab
  const renderMembers = () => (
    <View style={styles.tabContent}>
      {renderEmptyState('Members list coming soon...')}
    </View>
  );

  // Render reviews tab
  const renderReviews = () => (
    <View style={styles.tabContent}>
      {renderEmptyState('Reviews coming soon...')}
    </View>
  );

  if (loading || !clique) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
        <Text style={styles.loadingText}>Loading clique...</Text>
      </View>
    );
  }

  const memberCount = clique.members?.length || 0;
  const isPublic = clique.level === 'PUBLIC';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#6ba32d']}
          tintColor="#6ba32d"
        />
      }
    >
      {/* Banner Image */}
      <Image
        source={{
          uri: clique.banner || 'https://via.placeholder.com/600x200',
        }}
        style={styles.bannerImage}
      />

      {/* Clique Info */}
      <View style={styles.infoSection}>
        <View style={styles.headerRow}>
          <Text style={styles.cliqueName}>{clique.name}</Text>
          <View style={[styles.badge, isPublic ? styles.publicBadge : styles.privateBadge]}>
            <Text style={styles.badgeText}>{isPublic ? 'Public' : 'Private'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome name="users" size={16} color="#666" />
            <Text style={styles.statText}>{memberCount} members</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="briefcase" size={16} color="#666" />
            <Text style={styles.statText}>{clique.occupation}</Text>
          </View>
        </View>

        <Text style={styles.description}>{clique.description}</Text>

        {/* Join/Leave Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isMember ? styles.leaveButton : styles.joinButton,
          ]}
          onPress={handleJoinLeave}
          disabled={joiningClique}
          activeOpacity={0.8}
        >
          {joiningClique ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>
              {isMember ? 'Leave Clique' : 'Join Clique'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {activeTab === 'Posts' && posts.length > 0 && (
        <View style={styles.searchContainer}>
          <Searchbar
            style={styles.searchBar}
            placeholder="Search posts..."
            value={search}
            onChangeText={setSearch}
            iconColor="#6ba32d"
          />
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['Posts', 'Members', 'Reviews'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.contentSection}>
        {activeTab === 'Posts' && (
          <>
            {filteredPosts.length === 0 ? (
              renderEmptyState(
                search.trim() ? 'No posts match your search' : 'No posts yet'
              )
            ) : (
              <FlatList
                data={filteredPosts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPost}
                contentContainerStyle={styles.listContent}
                scrollEnabled={false}
              />
            )}
          </>
        )}
        {activeTab === 'Members' && renderMembers()}
        {activeTab === 'Reviews' && renderReviews()}
      </View>
    </ScrollView>
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
  bannerImage: {
    width: width,
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cliqueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  publicBadge: {
    backgroundColor: '#DEF7EC',
  },
  privateBadge: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  joinButton: {
    backgroundColor: '#6ba32d',
  },
  leaveButton: {
    backgroundColor: '#999',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    borderRadius: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6ba32d',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6ba32d',
    fontWeight: '600',
  },
  contentSection: {
    paddingVertical: 16,
  },
  tabContent: {
    minHeight: 200,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    marginBottom: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6ba32d',
    marginBottom: 2,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 8,
  },
  postCaption: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  iconText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default CliqueScreen;
