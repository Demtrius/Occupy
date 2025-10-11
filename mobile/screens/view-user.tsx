import React, { useState, useEffect, useRef } from 'react'
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	Dimensions,
	RefreshControl,
	ScrollView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { showError } from '../store/app.store'

import { Post, ScreenNavigationProp, ScreenRouteProp } from '../types'
import { PostItem, UserProfileHeader, UserTabs } from '../components'
import { useUsersStore } from '../store'

interface Props {
	route: ScreenRouteProp<'ViewUser'>
}

const { width, height } = Dimensions.get('window')

const ViewUserScreen: React.FC<Props> = ({ route }) => {
	const [activeTab, setActiveTab] = useState<'Posts' | 'Reviews'>('Posts')
	const [search, setSearch] = useState<string>('')
	const [showSearchBar, setShowSearchBar] = useState<boolean>(false)

	const searchBarRef = useRef<any>(null)
	const navigation = useNavigation<ScreenNavigationProp<'ViewUser'>>()
	const {
		userProfile,
		loading,
		refreshing,
		fetchUserProfile,
		refreshUserProfile,
		followUser,
		unfollowUser,
	} = useUsersStore()

	const { userId } = route.params

	useEffect(() => {
		fetchUserProfile(userId)
		// Posts will be fetched separately when needed
	}, [userId, fetchUserProfile])

	const handleFollow = async () => {
		try {
			await followUser(userId)
		} catch (error: any) {
			console.error('Error following user:', error)
			showError(error.message || 'Failed to follow user')
		}
	}

	const handleUnfollow = async () => {
		try {
			await unfollowUser(userId)
		} catch (error: any) {
			console.error('Error unfollowing user:', error)
			showError(error.message || 'Failed to unfollow user')
		}
	}

	const onRefresh = async () => {
		await refreshUserProfile()
	}

	const searchFilterFunction = (text: string) => {
		// TODO: Implement search when posts are fetched
		setSearch(text)
		if (!text) {
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

	const handleSearchPress = () => {
		setShowSearchBar(true)
		setTimeout(() => {
			searchBarRef.current?.focus()
		}, 100)
	}

	const handleTabPress = (tab: 'Posts' | 'Reviews') => {
		setActiveTab(tab)
	}

	if (loading && !refreshing) {
		return (
			<FlatList
				data={[]}
				keyExtractor={item => item.id.toString()}
				renderItem={renderPosts}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				style={styles.postsList}
				ListHeaderComponent={
					<View>
						<UserProfileHeader
							user={userProfile}
							showSearchBar={true}
							showTabs={false}
							showFollowButton={true}
							isFollowing={userProfile?.isFollowing || false}
							followersCount={userProfile?.followersCount || 0}
							followingCount={userProfile?.followingCount || 0}
							onFollow={handleFollow}
							onUnfollow={handleUnfollow}
							onTabPress={handleTabPress}
							activeTab={activeTab}
							searchValue={search}
							onSearchChange={searchFilterFunction}
							onContact={handleContactPress}
							isOwnProfile={false}
						/>
						<UserTabs activeTab={activeTab} onTabPress={handleTabPress} />
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
			<UserProfileHeader
				onBack={() => navigation.goBack()}
				user={userProfile}
				showSearchBar={showSearchBar}
				showTabs={false}
				showFollowButton={true}
				isFollowing={userProfile?.isFollowing || false}
				followersCount={userProfile?.followersCount || 0}
				followingCount={userProfile?.followingCount || 0}
				onFollow={handleFollow}
				onUnfollow={handleUnfollow}
				onSearchPress={handleSearchPress}
				onTabPress={handleTabPress}
				activeTab={activeTab}
				searchValue={search}
				onSearchChange={searchFilterFunction}
				onSearchBlur={() => {
					if (!search) setShowSearchBar(false)
				}}
				onContact={handleContactPress}
				isOwnProfile={false}
			/>

			<UserTabs activeTab={activeTab} onTabPress={handleTabPress} />
			{activeTab === 'Posts' && (
				<FlatList
					data={[]}
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
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginVertical: 16,
	},
	statItem: {
		alignItems: 'center',
	},
	statNumber: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#1F2937',
	},
	statLabel: {
		fontSize: 14,
		color: '#6B7280',
		marginTop: 4,
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
	followingButton: {
		backgroundColor: '#ef4444',
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