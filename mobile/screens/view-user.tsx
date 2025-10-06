import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { postsService } from '../services';
import usersService from '../services/users.service';
import { showError } from '@store/app.store';
import { Post, User } from '../types';

const { width, height } = Dimensions.get('window');

// Types
type RootStackParamList = {
  ViewUser: { id: number };
  NotificationsTab: { screen: string; params: { id: number } };
  PostDetail: { id: number };
};

type ViewUserScreenRouteProp = RouteProp<RootStackParamList, 'ViewUser'>;
type ViewUserScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  route: ViewUserScreenRouteProp;
}

const ViewUser: React.FC<Props> = ({ route }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'Posts' | 'Reviews'>('Posts');
  const [search, setSearch] = useState<string>('');
  const [filteredDataSource, setFilteredDataSource] = useState<Post[]>([]);
  const [masterDataSource, setMasterDataSource] = useState<Post[]>([]);
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const searchBarRef = useRef<any>(null);
  const navigation = useNavigation<ViewUserScreenNavigationProp>();

  const { id } = route.params;

  useEffect(() => {
    getUserData();
    getUserPosts();
  }, [id]);

  const getUserData = async () => {
    try {
      setLoading(true);
      const user = await usersService.getUserById(id);
      setUserData(user);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      showError(error.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const getUserPosts = async () => {
    try {
      const response = await postsService.getPostsByUser(id);
      const posts = Array.isArray(response) ? response : (response.results || []);
      setUserPosts(posts);
      setFilteredDataSource(posts);
      setMasterDataSource(posts);
    } catch (error: any) {
      console.error('Error fetching user posts:', error);
      showError(error.message || 'Failed to load user posts');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([getUserData(), getUserPosts()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const searchFilterFunction = (text: string) => {
    if (text) {
      const newData = masterDataSource.filter((item) => {
        const captionData = item.caption ? item.caption.toUpperCase() : '';
        const contentData = item.content ? item.content.toUpperCase() : '';
        const textData = text.toUpperCase();
        return captionData.indexOf(textData) > -1 || contentData.indexOf(textData) > -1;
      });
      setFilteredDataSource(newData);
      setSearch(text);
    } else {
      setFilteredDataSource(masterDataSource);
      setSearch(text);
      setShowSearchBar(false);
    }
  };

  const handlePostPress = (postId: number) => {
    navigation.navigate('PostDetail', { id: postId });
  };

  const handleContactPress = () => {
    navigation.navigate('NotificationsTab', {
      screen: 'MessageDetail',
      params: { id },
    });
  };

  const renderPosts = ({ item }: { item: Post }) => {
    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => handlePostPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            </View>
          )}
        </View>
        <Text style={styles.postCaption} numberOfLines={2}>
          {item.caption || 'No caption'}
        </Text>
        {item.content && item.content !== item.caption && (
          <Text style={styles.postContent} numberOfLines={2}>
            {item.content}
          </Text>
        )}
        <View style={styles.postMeta}>
          <View style={styles.postMetaItem}>
            <Ionicons name="heart-outline" size={16} color="#6B7280" />
            <Text style={styles.postMetaText}>{item.likesCount || 0}</Text>
          </View>
          <View style={styles.postMetaItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
            <Text style={styles.postMetaText}>{item.commentsCount || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderReviews = () => {
    return (
      <View style={styles.placeholderContainer}>
        <Ionicons name="star-outline" size={64} color="#9CA3AF" />
        <Text style={styles.placeholderText}>Reviews coming soon...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.headerContainer}>
        {!showSearchBar && (
          <>
            <Text style={styles.headerTitle}>User Profile</Text>
            <TouchableOpacity
              onPress={() => {
                setShowSearchBar(true);
                setTimeout(() => {
                  searchBarRef.current?.focus();
                }, 100);
              }}
              style={styles.searchIcon}
            >
              <Ionicons name="search" size={24} color="#1F2937" />
            </TouchableOpacity>
          </>
        )}
        {showSearchBar && (
          <PaperSearchbar
            ref={searchBarRef}
            style={styles.searchBar}
            placeholder="Search posts"
            value={search}
            onChangeText={(text) => searchFilterFunction(text)}
            onBlur={() => {
              if (!search) setShowSearchBar(false);
            }}
          />
        )}
      </View>

      {userData && (
        <View style={styles.userInfoContainer}>
          <View style={styles.userAvatarContainer}>
            {userData.profileImage ? (
              <Image source={{ uri: userData.profileImage }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarPlaceholder}>
                <Ionicons name="person" size={48} color="#9CA3AF" />
              </View>
            )}
          </View>

          <Text style={styles.userName}>{userData.username}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>

          {userData.occupations && (
            <View style={styles.userMetaItem}>
              <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
              <Text style={styles.userMetaText}>{userData.occupations}</Text>
            </View>
          )}

          {userData.createdAt && (
            <View style={styles.userMetaItem}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.userMetaText}>
                Joined {new Date(userData.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactPress}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#ffffff" />
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tabContainer}>
        {['Posts', 'Reviews'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as 'Posts' | 'Reviews')}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      {activeTab === 'Posts' && (
        <FlatList
          data={filteredDataSource}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPosts}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6ba32d"
              colors={['#6ba32d']}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          )}
        />
      )}
      {activeTab === 'Reviews' && (
        <View style={styles.screenContainer}>
          {renderHeader()}
          {renderReviews()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: height * 0.08,
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    paddingLeft: 40,
  },
  searchIcon: {
    paddingRight: 0,
  },
  searchBar: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: width * 0.92,
  },
  userInfoContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  userAvatarContainer: {
    marginBottom: 16,
  },
  userAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
  },
  userAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  userMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  userMetaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6ba32d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6ba32d',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#6ba32d',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCaption: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  postContent: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  postMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postMetaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
  },
});

export default ViewUser;
