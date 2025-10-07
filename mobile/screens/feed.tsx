// import { useNavigation } from "@react-navigation/native";
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	// TouchableOpacity,
	View,
} from 'react-native'
import { Button, Searchbar } from 'react-native-paper'
import { PostItem } from '../components'
import { useDebounce } from '../hooks'
import { cliquesService, postsService } from '../services'
import { showError } from '../store/app.store'
import type { Clique, Post } from '../types'

const { width, height } = Dimensions.get('window')

const FeedScreen: React.FC = () => {
	// const navigation = useNavigation<ScreenNavigationProp<"Feed">>();

	const [posts, setPosts] = useState<Post[]>([])
	const [cliques, setCliques] = useState<Clique[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [refreshing, setRefreshing] = useState<boolean>(false)
	const [loadingMore, setLoadingMore] = useState<boolean>(false)
	const [hasMore, setHasMore] = useState<boolean>(true)
	const [page, setPage] = useState<number>(1)
	const [lastRequestTime, setLastRequestTime] = useState<number>(0)

	const [search, setSearch] = useState<string>('')
	const [category, setCategory] = useState<number | 'all'>('all')

	// Use refs for cache to avoid dependency issues and unnecessary re-renders
	const postsCacheRef = useRef<Record<string, Post[]>>({})
	const categoryPagesRef = useRef<Record<string, number>>({})
	const categoryHasMoreRef = useRef<Record<string, boolean>>({})
	const categoryRef = useRef<number | 'all'>('all')

	// const [nearYouPosts, setNearYouPosts] = useState<Post[]>([]);

	const debouncedSearch = useDebounce(search, 500)

	// Fetch cliques
	const getCliques = useCallback(async () => {
		try {
			const data = await cliquesService.getAllCliques()
			setCliques(data)
		} catch (error) {
			console.error('Error fetching cliques:', error)
			showError('Failed to load cliques')
		} finally {
			setLoading(false)
		}
	}, [])

	// Fetch posts with caching
	const getPosts = useCallback(
		async (categoryFilter: number | 'all' = 'all', pageNum: number = 1, append: boolean = false) => {
			try {
				// Check cache first
				const cacheKey = categoryFilter.toString()
				const cachedPosts = postsCacheRef.current[cacheKey] || []
				const currentPage = categoryPagesRef.current[cacheKey] || 1
				const currentHasMore = categoryHasMoreRef.current[cacheKey] ?? true

				// If we have cached data and not appending, use cache
				if (!append && cachedPosts.length > 0 && pageNum === 1) {
					setPosts(cachedPosts)
					setHasMore(currentHasMore)
					setPage(currentPage)
					return
				}

				let data: Post[] = []

				if (categoryFilter === 'all') {
					data = await postsService.getFeedPosts(pageNum, 20)
				} else {
					// For specific cliques, get posts by clique
					const response = await postsService.getPostsByClique(categoryFilter, pageNum, 20)
					data = response.results || []
				}

				if (append) {
					// Remove duplicates when appending
					const existingPosts = postsCacheRef.current[cacheKey] || []
					const combined = [...existingPosts, ...data]
					const unique = combined.filter(
						(item, index, self) =>
							self.findIndex(p => p.id === item.id) === index
					)

					postsCacheRef.current = { ...postsCacheRef.current, [cacheKey]: unique }
					setPosts(unique)
				} else {
					postsCacheRef.current = { ...postsCacheRef.current, [cacheKey]: data }
					setPosts(data)
				}

				// Update pagination state for this category
				const currentPageForCategory = categoryPagesRef.current[cacheKey] || 1
				const newPage = append ? currentPageForCategory + 1 : pageNum
				const newHasMore = data.length === 20 && newPage < 10

				categoryPagesRef.current = { ...categoryPagesRef.current, [cacheKey]: newPage }
				categoryHasMoreRef.current = { ...categoryHasMoreRef.current, [cacheKey]: newHasMore }
				setHasMore(newHasMore)
				setPage(newPage)
			} catch (error) {
				console.error('Error fetching posts:', error)
				showError('Failed to load posts')
			}
		},
		[] // No dependencies needed since we use refs
	)

	// Fetch posts for "near you" section
	// const getPostsHorizontal = useCallback(async () => {
	//   try {
	//     const data = await postsService.getFeedPosts();
	//     setNearYouPosts(data.slice(0, 5));
	//   } catch (error) {
	//     console.error("Error fetching near you posts:", error);
	//   }
	// }, []);

	// Load more posts for infinite scroll
	const loadMorePosts = useCallback(async () => {
		const now = Date.now()
		const timeSinceLastRequest = now - lastRequestTime

		if (loadingMore || !hasMore || page >= 10 || timeSinceLastRequest < 1000)
			return // 1 second cooldown

		setLoadingMore(true)
		setLastRequestTime(now)
		const nextPage = page + 1
		try {
			await getPosts(categoryRef.current, nextPage, true)
		} catch (error) {
			console.error('Error loading more posts:', error)
		} finally {
			setLoadingMore(false)
		}
	}, [loadingMore, hasMore, page, getPosts, lastRequestTime]) // Removed category from dependencies

	// Refresh handler
	const onRefresh = useCallback(async () => {
		setRefreshing(true)
		setPage(1)
		setHasMore(true)
		setLastRequestTime(0) // Reset cooldown on refresh

		// Clear cache for current category to force refresh
		const cacheKey = categoryRef.current.toString()
		const newCache = { ...postsCacheRef.current }
		delete newCache[cacheKey]
		postsCacheRef.current = newCache

		const newPages = { ...categoryPagesRef.current }
		delete newPages[cacheKey]
		categoryPagesRef.current = newPages

		const newHasMore = { ...categoryHasMoreRef.current }
		delete newHasMore[cacheKey]
		categoryHasMoreRef.current = newHasMore

		try {
			await Promise.all([getCliques(), getPosts(categoryRef.current, 1, false)])
		} catch (error) {
			console.error('Error refreshing:', error)
		} finally {
			setRefreshing(false)
		}
	}, [getCliques, getPosts]) // Removed category from dependencies

	// Filter by category
	const filterByCategory = useCallback(
		(selectedCategory: number | 'all') => {
			setCategory(selectedCategory)
			categoryRef.current = selectedCategory
			// Don't refetch if we already have cached data for this category
			getPosts(selectedCategory, 1, false)
		},
		[getPosts]
	)

	// Initial load
	useEffect(() => {
		categoryRef.current = 'all'
		getCliques()
		getPosts('all', 1, false)
		setPage(1)
	}, [getCliques, getPosts])

	// Memoize filtered data to prevent unnecessary re-renders
	const filteredDataSource = useMemo(() => {
		let filtered = posts

		// Apply search filter if active
		if (debouncedSearch) {
			filtered = filtered.filter(item => {
				const itemData = item.caption ? item.caption.toUpperCase() : ''
				return itemData.includes(debouncedSearch.toUpperCase())
			})
		}

		// Remove duplicates based on post ID (shouldn't be necessary but keeping for safety)
		return filtered.filter(
			(item, index, self) => self.findIndex(p => p.id === item.id) === index
		)
	}, [posts, debouncedSearch])

	// Update hasMore based on search state
	useEffect(() => {
		setHasMore(!debouncedSearch)
	}, [debouncedSearch])

	// Navigate to messages (commented out)
	// const navigateToMessages = (userId: number) => {
	//   navigation.navigate("MessageDetail", { messageId: userId });
	// };

	// Render near you posts (commented out)
	// const renderNearYou = ({ item }: { item: Post }) => {
	//   const cliqueName =
	//     cliques.find((clique) => clique.id === item.cliqueId)?.name ||
	//     "Unknown Clique";

	//   return (
	//     <TouchableOpacity
	//       style={styles.nearYouCard}
	//       onPress={() =>
	//         navigation.navigate("PostDetail", { id: item.id })
	//       }
	//       activeOpacity={0.7}
	//     >
	//       <View style={styles.cardHeader}>
	//         <Image
	//           source={{
	//             uri: item.avatar || "https://via.placeholder.com/300x200",
	//           }}
	//           style={styles.cardImage}
	//         />
	//         <Text style={styles.dateBadge}>{item.posted || "Recent"}</Text>
	//       </View>
	//       <Text style={styles.cardTitle} numberOfLines={2}>
	//         {item.caption}
	//       </Text>
	//       <Text style={styles.cardSubtitle} numberOfLines={1}>
	//         {cliqueName}
	//       </Text>
	//       <TouchableOpacity
	//         style={styles.contactButton}
	//         onPress={(e) => {
	//           e.stopPropagation();
	//           navigateToMessages(item.userId);
	//         }}
	//       >
	//         <Text style={styles.contactButtonText}>Contact</Text>
	//       </TouchableOpacity>
	//     </TouchableOpacity>
	//   );
	// };

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color='#6ba32d' />
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<Searchbar
				style={styles.searchBar}
				placeholder='Search'
				value={search}
				onChangeText={setSearch}
			/>

			<View style={styles.categoryContainer}>
				<ScrollView
					horizontal={true}
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.scrollViewContent}
				>
					<Button
						mode={category === 'all' ? 'contained' : 'outlined'}
						onPress={() => filterByCategory('all')}
						color='#6ba32d'
						contentStyle={styles.buttonContent}
						style={styles.button}
					>
						All
					</Button>
					{cliques.map(clique => (
						<Button
							key={clique.id}
							mode={category === clique.id ? 'contained' : 'outlined'}
							onPress={() => filterByCategory(clique.id)}
							color='#6ba32d'
							contentStyle={styles.buttonContent}
							style={styles.button}
						>
							{clique.name}
						</Button>
					))}
				</ScrollView>
			</View>

			<Text
				style={[
					styles.sectionTitle,
					{
						marginLeft: width * 0.04,
						marginTop: height * 0.02,
						marginBottom: height * 0.01,
					},
				]}
			>
				Posts for you
			</Text>

			<View style={{ paddingHorizontal: 8 }}>
				{filteredDataSource.length === 0 ? (
					<Text style={styles.noPostsText}>No posts available</Text>
				) : (
					<FlatList
						data={filteredDataSource}
						keyExtractor={item => item.id.toString()}
						renderItem={({ item }) => <PostItem post={item} />}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
						}
						style={{ flexGrow: 0 }}
						onEndReached={loadMorePosts}
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

			{/* Near you section commented out */}
			{/* <View style={styles.nearYouSection}>
        <Text
          style={[
            styles.sectionTitle,
            { marginLeft: width * 0.04, marginBottom: 8 },
          ]}
        >
          Near you
        </Text>
        <FlatList
          horizontal
          data={nearYouPosts}
          keyExtractor={(item) => `near-${item.id}`}
          renderItem={renderNearYou}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nearYouContainer}
          style={styles.nearYouList}
        />
      </View> */}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'white',
		paddingTop: height * 0.08,
		paddingBottom: height * 0.16,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'white',
	},
	searchBar: {
		marginHorizontal: width * 0.04,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	categoryContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginVertical: height * 0.01,
		paddingHorizontal: width * 0.01,
	},
	scrollViewContent: {
		paddingHorizontal: width * 0.04,
	},
	button: {
		borderRadius: 20,
		paddingHorizontal: 0,
		marginRight: 10,
	},
	buttonContent: {
		paddingVertical: 0,
		paddingHorizontal: 0,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#1F2937',
		marginBottom: 1,
	},
	noPostsText: {
		textAlign: 'center',
		fontSize: 16,
		color: '#888',
		marginTop: 20,
	},
	nearYouSection: {
		position: 'absolute',
		bottom: 0,
		width: '100%',
		backgroundColor: 'white',
		paddingBottom: 20,
	},
	nearYouContainer: {
		paddingHorizontal: width * 0.04,
	},
	nearYouList: {
		maxHeight: 200,
	},
	nearYouCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
		elevation: 3,
		marginRight: 16,
		width: width * 0.4,
		padding: 16,
	},
	cardHeader: {
		position: 'relative',
	},
	cardImage: {
		width: '100%',
		height: 80,
		borderRadius: 8,
		marginBottom: 8,
		backgroundColor: '#E5E7EB',
	},
	dateBadge: {
		position: 'absolute',
		top: 8,
		right: 8,
		backgroundColor: '#6ba32d',
		color: '#FFFFFF',
		fontSize: 10,
		fontWeight: '600',
		paddingVertical: 2,
		paddingHorizontal: 6,
		borderRadius: 4,
	},
	cardTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1F2937',
		marginBottom: 4,
	},
	cardSubtitle: {
		fontSize: 12,
		color: '#6B7280',
		marginBottom: 12,
	},
	contactButton: {
		borderWidth: 1,
		borderColor: '#6ba32d',
		borderRadius: 8,
		paddingVertical: 6,
		alignItems: 'center',
	},
	contactButtonText: {
		fontSize: 14,
		color: '#6ba32d',
		fontWeight: '600',
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

export default FeedScreen
