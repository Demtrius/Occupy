import React, { useRef } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
} from 'react-native'
import { Searchbar as PaperSearchbar } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/auth.store'
import { User } from '../../types'
import { UserAvatar, UserStats, UserActions } from '../index'

const { width } = Dimensions.get('window')

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
	onBack?: () => void
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
	onBack,
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
						{onBack && (
							<TouchableOpacity
								onPress={onBack}
								style={styles.backButton}
							>
								<Ionicons name='arrow-back' size={24} color='#1F2937' />
							</TouchableOpacity>
						)}
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
					<UserAvatar profileImage={user.profileImage} />

					<Text style={styles.userName}>{user.username}</Text>
					<Text style={styles.userEmail}>{user.email}</Text>

					<UserStats
						followersCount={followersCount}
						followingCount={followingCount}
					/>

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

					<UserActions
						showFollowButton={showFollowButton}
						isFollowing={isFollowing}
						onFollow={onFollow}
						onUnfollow={onUnfollow}
						onContact={onContact}
						isOwnProfile={isOwnProfile}
					/>
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
	backButton: {
		paddingLeft: 0,
		paddingRight: 8,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#1F2937',
		flex: 1,
		textAlign: 'center',
		paddingLeft: 0,
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
