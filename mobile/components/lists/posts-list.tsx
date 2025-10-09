import React from 'react'
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import { PostItem } from './post-item'
import type { Post } from '../../types'

const { width, height } = Dimensions.get('window')

interface PostsListProps {
	posts: Post[]
	refreshing: boolean
	onRefresh: () => void
	onLoadMore: () => void
	loadingMore: boolean
}

const PostsList: React.FC<PostsListProps> = ({
	posts,
	refreshing,
	onRefresh,
	onLoadMore,
	loadingMore,
}) => {
	return (
		<View style={{ paddingHorizontal: 8 }}>
			{posts.length === 0 ? (
				<Text style={styles.noPostsText}>No posts available</Text>
			) : (
				<FlatList
					data={posts}
					keyExtractor={item => item.id.toString()}
					renderItem={({ item }) => <PostItem post={item} />}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
					}
					style={{ flexGrow: 0 }}
					onEndReached={onLoadMore}
					onEndReachedThreshold={0.5}
					ListFooterComponent={
						loadingMore ? (
							<View style={styles.loadingFooter}>
								<ActivityIndicator size='small' color='#6ba32d' />
								<Text style={styles.loadingText}>Loading more...</Text>
							</View>
						) : null
					}
				/>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	noPostsText: {
		textAlign: 'center',
		fontSize: 16,
		color: '#888',
		marginTop: 20,
	},
	loadingFooter: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 16,
	},
	loadingText: {
		marginLeft: 8,
		fontSize: 14,
		color: '#6B7280',
	},
})

export { PostsList }