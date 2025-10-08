import React, { useRef } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
	Image,
} from 'react-native'
import { Searchbar as PaperSearchbar } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/auth.store'
import { User } from '../types'

const { width, height } = Dimensions.get('window')

interface UserProfileHeaderProps {
	user?: User | null
	showSearchBar?: boolean
	showTabs?: boolean
	showFollowButton?: boolean
	isFollowing?: boolean
	followersCount?: number
	followingCount?: number
	onSearchPress?: () => void
	onTabPress?: (tab: string) => void
	activeTab?: string
	searchValue?: string
	onSearchChange?: (text: string) => void
	onSearchBlur?: () => void
	onFollow?: () => void
	onUnfollow?: () => void
	onContact?: () => void
	isOwnProfile?: boolean
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
	user: propUser,
	showSearchBar = false,
	showTabs = false,
	showFollowButton = false,
	isFollowing = false,
	followersCount = 0,
	followingCount = 0,
	onSearchPress,
	onTabPress,
	activeTab,
	searchValue = '',
	onSearchChange,
	onSearchBlur,
	onFollow,
	onUnfollow,
	onContact,
	isOwnProfile = false,
}) => {
	const searchBarRef = useRef<any>(null)

	// Get current user from auth store if this is the current user's profile
	const currentUser = useAuthStore(state => state.user)
	const user = isOwnProfile ? currentUser : propUser

	const handleSearchPress = () => {
		onSearchPress?.()
		setTimeout(() => {
			searchBarRef.current?.focus()
		}, 100)
	}

	return (
		<>
			<View style={styles.headerContainer}>
				{showSearchBar ? (
					<PaperSearchbar
						ref={searchBarRef}
						style={styles.searchBar}
						placeholder='Search posts'
						value={searchValue}
						onChangeText={onSearchChange}
						onBlur={onSearchBlur}
					/>
				) : (
					<>
						<Text style={styles.headerTitle}>User Profile</Text>
						<TouchableOpacity
							onPress={handleSearchPress}
							style={styles.searchIcon}
						>
							<Ionicons name='search' size={24} color='#1F2937' />
						</TouchableOpacity>
					</>
				)}
			</View>

			{user && (
				<View style={styles.userInfoContainer}>
					<View style={styles.userAvatarContainer}>
						{user.profileImage ? (
							<Image
								source={{ uri: user.profileImage }}
								style={styles.userAvatar}
							/>
						) : (
							<View style={styles.userAvatarPlaceholder}>
								<Ionicons name='person' size={48} color='#9CA3AF' />
							</View>
						)}
					</View>

					<Text style={styles.userName}>{user.username}</Text>
					<Text style={styles.userEmail}>{user.email}</Text>

					<View style={styles.statsContainer}>
						<View style={styles.statItem}>
							<Text style={styles.statNumber}>{followersCount}</Text>
							<Text style={styles.statLabel}>Followers</Text>
						</View>
						<View style={styles.statItem}>
							<Text style={styles.statNumber}>{followingCount}</Text>
							<Text style={styles.statLabel}>Following</Text>
						</View>
					</View>

					{user.occupations && (
						<View style={styles.userMetaItem}>
							<Ionicons name='briefcase-outline' size={16} color='#6B7280' />
							<Text style={styles.userMetaText}>{user.occupations}</Text>
						</View>
					)}

					{user.createdAt && (
						<View style={styles.userMetaItem}>
							<Ionicons name='calendar-outline' size={16} color='#6B7280' />
							<Text style={styles.userMetaText}>
								Joined {new Date(user.createdAt).toLocaleDateString()}
							</Text>
						</View>
					)}

					{showFollowButton && !isOwnProfile ? (
						<TouchableOpacity
							style={[
								styles.contactButton,
								isFollowing && styles.followingButton,
							]}
							onPress={isFollowing ? onUnfollow : onFollow}
						>
							<Ionicons
								name={isFollowing ? 'person-remove' : 'person-add'}
								size={20}
								color='#ffffff'
							/>
							<Text style={styles.contactButtonText}>
								{isFollowing ? 'Unfollow' : 'Follow'}
							</Text>
						</TouchableOpacity>
					) : (
						onContact && (
							<TouchableOpacity
								style={styles.contactButton}
								onPress={onContact}
							>
								<Ionicons name='chatbubble-outline' size={20} color='#ffffff' />
								<Text style={styles.contactButtonText}>Contact</Text>
							</TouchableOpacity>
						)
					)}
				</View>
			)}

			{showTabs && (
				<View style={styles.tabContainer}>
					{['Posts', 'Reviews'].map(tab => (
						<TouchableOpacity
							key={tab}
							style={[
								styles.tab,
								{ flex: 1 },
								activeTab === tab && styles.activeTab,
							]}
							onPress={() => onTabPress?.(tab)}
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
			)}
		</>
	)
}

const styles = StyleSheet.create({
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
		gap: 24,
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
})

export default UserProfileHeader
