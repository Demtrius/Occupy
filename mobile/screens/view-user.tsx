import React, { useState, useEffect, useRef } from 'react'
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
	ScrollView,
} from 'react-native'
import { Searchbar as PaperSearchbar } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { postsService } from '../services'
import usersService from '../services/users.service'
import { showError } from '@store/app.store'
import { Post, User, ScreenNavigationProp, ScreenRouteProp } from '../types'
import { PostItem } from '../components'

interface Props {
	route: ScreenRouteProp<'ViewUser'>
}

const { width, height } = Dimensions.get('window')

const ViewUserScreen: React.FC<Props> = ({ route }) => {
	const [loading, setLoading] = useState<boolean>(true)
	const [refreshing, setRefreshing] = useState<boolean>(false)
	const [activeTab, setActiveTab] = useState<'Posts' | 'Reviews'>('Posts')
	const [search, setSearch] = useState<string>('')
	const [filteredDataSource, setFilteredDataSource] = useState<Post[]>([])
	const [masterDataSource, setMasterDataSource] = useState<Post[]>([])
	const [showSearchBar, setShowSearchBar] = useState<boolean>(false)
	const [userData, setUserData] = useState<User | null>(null)

	const searchBarRef = useRef<any>(null)
	const navigation = useNavigation<ScreenNavigationProp<'ViewUser'>>()

	const { userId } = route.params

	useEffect(() => {
		getUserData()
		getUserPosts()
	}, [userId])

	const getUserData = async () => {
		try {
			setLoading(true)
			const user = await usersService.getUserById(userId)
			setUserData(user)
		} catch (error: any) {
			console.error('Error fetching user:', error)
			showError(error.message || 'Failed to load user data')
		} finally {
			setLoading(false)
		}
	}

	const getUserPosts = async () => {
		try {
			const response = await postsService.getPostsByUser(userId)
			const posts = Array.isArray(response) ? response : response.results || []
			setFilteredDataSource(posts)
			setMasterDataSource(posts)
		} catch (error: any) {
			console.error('Error fetching user posts:', error)
			showError(error.message || 'Failed to load user posts')
		}
	}

	const onRefresh = async () => {
		setRefreshing(true)
		try {
			await Promise.all([getUserData(), getUserPosts()])
		} catch (error) {
			console.error('Error refreshing:', error)
		} finally {
			setRefreshing(false)
		}
	}

	const searchFilterFunction = (text: string) => {
		if (text) {
			const newData = masterDataSource.filter(item => {
				const captionData = item.caption ? item.caption.toUpperCase() : ''
				const contentData = item.content ? item.content.toUpperCase() : ''
				const textData = text.toUpperCase()
				return (
					captionData.indexOf(textData) > -1 ||
					contentData.indexOf(textData) > -1
				)
			})
			setFilteredDataSource(newData)
			setSearch(text)
		} else {
			setFilteredDataSource(masterDataSource)
			setSearch(text)
			setShowSearchBar(false)
		}
	}

	const handleContactPress = () => {
		navigation.navigate('NotificationsTab', {
			screen: 'MessageDetail',
			params: { messageId: userId },
		} as never)
	}

	const renderPosts = ({ item }: { item: Post }) => {
		return <PostItem post={item} />
	}

	const renderReviews = () => {
		return (
			<View style={styles.placeholderContainer}>
				<Ionicons name='star-outline' size={64} color='#9CA3AF' />
				<Text style={styles.placeholderText}>Reviews coming soon...</Text>
			</View>
		)
	}

	const renderHeader = () => (
		<>
			<View style={styles.headerContainer}>
				{!showSearchBar && (
					<>
						<Text style={styles.headerTitle}>User Profile</Text>
						<TouchableOpacity
							onPress={() => {
								setShowSearchBar(true)
								setTimeout(() => {
									searchBarRef.current?.focus()
								}, 100)
							}}
							style={styles.searchIcon}
						>
							<Ionicons name='search' size={24} color='#1F2937' />
						</TouchableOpacity>
					</>
				)}
				{showSearchBar && (
					<PaperSearchbar
						ref={searchBarRef}
						style={styles.searchBar}
						placeholder='Search posts'
						value={search}
						onChangeText={text => searchFilterFunction(text)}
						onBlur={() => {
							if (!search) setShowSearchBar(false)
						}}
					/>
				)}
			</View>

			{userData && (
				<View style={styles.userInfoContainer}>
					<View style={styles.userAvatarContainer}>
						{userData.profileImage ? (
							<Image
								source={{ uri: userData.profileImage }}
								style={styles.userAvatar}
							/>
						) : (
							<View style={styles.userAvatarPlaceholder}>
								<Ionicons name='person' size={48} color='#9CA3AF' />
							</View>
						)}
					</View>

					<Text style={styles.userName}>{userData.username}</Text>
					<Text style={styles.userEmail}>{userData.email}</Text>

					{userData.occupations && (
						<View style={styles.userMetaItem}>
							<Ionicons name='briefcase-outline' size={16} color='#6B7280' />
							<Text style={styles.userMetaText}>{userData.occupations}</Text>
						</View>
					)}

					{userData.createdAt && (
						<View style={styles.userMetaItem}>
							<Ionicons name='calendar-outline' size={16} color='#6B7280' />
							<Text style={styles.userMetaText}>
								Joined {new Date(userData.createdAt).toLocaleDateString()}
							</Text>
						</View>
					)}

					<TouchableOpacity
						style={styles.contactButton}
						onPress={handleContactPress}
					>
						<Ionicons name='chatbubble-outline' size={20} color='#ffffff' />
						<Text style={styles.contactButtonText}>Contact</Text>
					</TouchableOpacity>
				</View>
			)}

			<View style={styles.tabContainer}>
				{['Posts', 'Reviews'].map(tab => (
					<TouchableOpacity
						key={tab}
						style={[
							styles.tab,
							{ flex: 1 },
							activeTab === tab && styles.activeTab,
						]}
						onPress={() => setActiveTab(tab as 'Posts' | 'Reviews')}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === tab && styles.activeTabText,
							]}
						>
							{tab}
						</Text>
					</TouchableOpacity>
				))}
			</View>
		</>
	)

	if (loading && !refreshing) {
		return (
			<FlatList
				data={activeTab === 'Posts' ? filteredDataSource : []}
				keyExtractor={item => item.id.toString()}
				renderItem={renderPosts}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				style={styles.postsList}
				ListHeaderComponent={
					<View>
						<PaperSearchbar
							style={styles.searchBar}
							placeholder='Search'
							value={search}
							onChangeText={searchFilterFunction}
						/>

						<View style={styles.headerContainer}>
							{!showSearchBar && userData && (
								<View style={styles.userInfoContainer}>
									{userData.profileImage ? (
										<Image
											source={{ uri: userData.profileImage }}
											style={styles.userAvatar}
										/>
									) : (
										<View style={styles.userAvatarPlaceholder}>
											<Ionicons name='person' size={32} color='#9CA3AF' />
										</View>
									)}

									<View style={styles.userDetails}>
										<Text style={styles.userName}>{userData.username}</Text>
										<Text style={styles.userEmail}>{userData.email}</Text>

										{userData.occupations && (
											<View style={styles.userMetaItem}>
												<Ionicons
													name='briefcase-outline'
													size={16}
													color='#6B7280'
												/>
												<Text style={styles.userMetaText}>
													{userData.occupations}
												</Text>
											</View>
										)}

										{userData.createdAt && (
											<View style={styles.userMetaItem}>
												<Ionicons
													name='calendar-outline'
													size={16}
													color='#6B7280'
												/>
												<Text style={styles.userMetaText}>
													Joined{' '}
													{new Date(userData.createdAt).toLocaleDateString()}
												</Text>
											</View>
										)}

										<TouchableOpacity
											style={styles.contactButton}
											onPress={handleContactPress}
										>
											<Ionicons
												name='chatbubble-outline'
												size={20}
												color='#ffffff'
											/>
											<Text style={styles.contactButtonText}>Contact</Text>
										</TouchableOpacity>
									</View>
								</View>
							)}

							<View style={styles.tabContainer}>
								{['Posts', 'Reviews'].map(tab => (
									<TouchableOpacity
										key={tab}
										style={[styles.tab, activeTab === tab && styles.activeTab]}
										onPress={() => setActiveTab(tab as 'Posts' | 'Reviews')}
									>
										<Text
											style={[
												styles.tabText,
												activeTab === tab && styles.activeTabText,
											]}
										>
											{tab}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>

						{activeTab === 'Reviews' && renderReviews()}
					</View>
				}
				ListEmptyComponent={
					activeTab === 'Posts' ? (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>No posts available</Text>
						</View>
					) : null
				}
			/>
		)
	}

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}
		>
			{renderHeader()}
			{activeTab === 'Posts' && (
				<FlatList
					data={filteredDataSource}
					keyExtractor={item => item.id.toString()}
					renderItem={renderPosts}
					scrollEnabled={false}
					contentContainerStyle={styles.listContainer}
					ListEmptyComponent={() => (
						<View style={styles.emptyContainer}>
							<Ionicons
								name='document-text-outline'
								size={64}
								color='#9CA3AF'
							/>
							<Text style={styles.emptyText}>No posts yet</Text>
						</View>
					)}
				/>
			)}
			{activeTab === 'Reviews' && renderReviews()}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	scrollContentContainer: {
		paddingTop: height * 0.08,
		flexGrow: 1,
	},
	postsList: {
		flex: 1,
	},
	userDetails: {
		padding: 20,
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
		textAlign: 'center',
		color: '#6B7280',
	},
	activeTabText: {
		color: '#6ba32d',
		fontWeight: 'bold',
	},
	listContainer: {
		paddingTop: 8,
		paddingBottom: 20,
		paddingHorizontal: 8,
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
})

export default ViewUserScreen
