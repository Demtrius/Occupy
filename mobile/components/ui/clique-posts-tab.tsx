import React from 'react'
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Post } from '../../types'
import { PostItem } from '../lists/post-item'

interface CliquePostsTabProps {
  posts: Post[]
  refreshing: boolean
  onRefresh: () => void
}

const CliquePostsTab: React.FC<CliquePostsTabProps> = ({
  posts,
  refreshing,
  onRefresh,
}) => {
  return (
    <FlatList
      key="posts-tab"
      style={styles.tabContent}
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <PostItem post={item} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#6ba32d"
          colors={["#6ba32d"]}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
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
})

export default CliquePostsTab