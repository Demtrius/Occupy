import type React from 'react'
import { useState, useEffect } from 'react'
import {
	View,
	StyleSheet,
	Text,
	FlatList,
	ActivityIndicator,
	RefreshControl,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { postsService } from '../services'
import { showError } from '../store/app.store'
import { useAuthStore } from '../store/auth.store'
import type { Post, ScreenNavigationProp } from '../types'
import { PrimaryButton, ScreenHeader, PostItem, EmptyState, NotLoggedInState } from '../components'

const HomeScreen: React.FC = () => {
	const navigation = useNavigation<ScreenNavigationProp<'Home'>>()
	const isLoggedIn = useAuthStore(state => state.isLoggedIn)

	const [posts, setPosts] = useState<Post[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [refreshing, setRefreshing] = useState<boolean>(false)

	// Fetch posts
	const getPosts = async () => {
		try {
			const response = await postsService.getFeedPosts()
			setPosts(response.results || [])
		} catch (error) {
			console.error('Error fetching posts:', error)
			showError('Failed to load posts. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	// Refresh handler
	const onRefresh = async () => {
		setRefreshing(true)
		try {
			await getPosts()
		} catch (error) {
			console.error('Error refreshing:', error)
		} finally {
			setRefreshing(false)
		}
	}

	// Initial load
	useEffect(() => {
		if (isLoggedIn) {
			getPosts()
		} else {
			setLoading(false)
		}
	}, [isLoggedIn])



	// Not logged in state
	if (!isLoggedIn) {
		return <NotLoggedInState />
	}

	// Loading state
	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color='#6ba32d' />
				<Text style={styles.loadingText}>Loading your feed...</Text>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<ScreenHeader title='Home Feed' showBackButton={false} />

			{/* Posts List */}
			{posts.length === 0 ? (
				<EmptyState message="Follow cliques to see posts in your feed" actionText="Explore Cliques" />
			) : (
				<FlatList
					data={posts}
					keyExtractor={item => item.id.toString()}
					renderItem={({ item }) => <PostItem post={item} />}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							colors={['#6ba32d']}
							tintColor='#6ba32d'
						/>
					}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</View>
	)
}

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
})

export default HomeScreen
