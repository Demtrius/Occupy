import React, { useState, useEffect } from 'react'
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	Dimensions,
	ScrollView,
} from 'react-native'
import { useAuthStore } from '../store/auth.store'
import { showSuccess } from '../store/app.store'
import { ScreenNavigationProp } from '../types'
import { PrimaryButton } from '../components'
import UserProfileHeader from '../components/user-profile-header'
import { usersService } from '../services'

const { width, height } = Dimensions.get('window')

interface ProfileProps {
	navigation: ScreenNavigationProp<'Profile'>
}

const ProfileScreen: React.FC<ProfileProps> = ({ navigation }) => {
	const user = useAuthStore(state => state.user)
	const logout = useAuthStore(state => state.logout)

	const [userStats, setUserStats] = useState<{
		followersCount: number
		followingCount: number
		postsCount: number
		cliquesCount: number
	} | null>(null)
	const [showAccountInfo, setShowAccountInfo] = useState<boolean>(false)
	const [showAppearanceInfo, setShowAppearanceInfo] = useState<boolean>(false)
	const [showLanguageInfo, setShowLanguageInfo] = useState<boolean>(false)
	const [logoutModalVisible, setLogoutModalVisible] = useState<boolean>(false)

	useEffect(() => {
		const fetchUserStats = async () => {
			if (user?.id) {
				try {
					const stats = await usersService.getUserStats(user.id)
					setUserStats(stats)
				} catch (error) {
					console.error('Failed to fetch user stats:', error)
				}
			}
		}

		fetchUserStats()
	}, [user?.id])

	const handleLogout = async () => {
		try {
			await logout()
			setLogoutModalVisible(false)
			showSuccess('Logged out successfully')
		} catch (error) {
			console.error('Logout error:', error)
			setLogoutModalVisible(false)
		}
	}

	const toggleAccountInfo = () => {
		setShowAccountInfo(!showAccountInfo)
	}

	const toggleAppearanceInfo = () => {
		setShowAppearanceInfo(!showAppearanceInfo)
	}

	const toggleLanguageInfo = () => {
		setShowLanguageInfo(!showLanguageInfo)
	}

	return (
		<ScrollView style={styles.container}>
			<UserProfileHeader
				user={user}
				showFollowButton={false}
				followersCount={userStats?.followersCount || 0}
				followingCount={userStats?.followingCount || 0}
				isOwnProfile={true}
			/>

			{/* Menu Section */}
			<View style={styles.menu}>
				<TouchableOpacity style={styles.menuItem} onPress={toggleAccountInfo}>
					<Text style={styles.menuText}>Account info</Text>
					<Text style={styles.menuIcon}>{showAccountInfo ? '▼' : '▶'}</Text>
				</TouchableOpacity>
				{showAccountInfo && (
					<View style={styles.accountInfo}>
						<Text style={styles.infoText}>Username: {user?.username}</Text>
						<Text style={styles.infoText}>Email: {user?.email}</Text>
						<Text style={styles.infoText}>
							Occupations: {user?.occupations || 'None'}
						</Text>
					</View>
				)}

				<TouchableOpacity
					style={styles.menuItem}
					onPress={() => navigation.navigate('NotificationsTab')}
				>
					<Text style={styles.menuText}>Recent messages</Text>
					<Text style={styles.menuIcon}>▶</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.menuItem}>
					<Text style={styles.menuText}>Recent jobs</Text>
					<Text style={styles.menuIcon}>▶</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.menuItem}
					onPress={toggleAppearanceInfo}
				>
					<Text style={styles.menuText}>Appearance</Text>
					<Text style={styles.menuIcon}>{showAppearanceInfo ? '▼' : '▶'}</Text>
				</TouchableOpacity>
				{showAppearanceInfo && (
					<View style={styles.accountInfo}>
						<Text style={styles.infoText}>Coming Soon</Text>
					</View>
				)}

				<TouchableOpacity style={styles.menuItem} onPress={toggleLanguageInfo}>
					<Text style={styles.menuText}>Language</Text>
					<Text style={styles.menuIcon}>{showLanguageInfo ? '▼' : '▶'}</Text>
				</TouchableOpacity>
				{showLanguageInfo && (
					<View style={styles.accountInfo}>
						<Text style={styles.infoText}>Coming Soon</Text>
					</View>
				)}
			</View>

			{/* Logout Button */}
			<TouchableOpacity
				style={styles.logoutButton}
				onPress={() => setLogoutModalVisible(true)}
			>
				<Text style={styles.logoutButtonText}>Logout</Text>
			</TouchableOpacity>

			{/* Logout Confirmation Modal */}
			<Modal
				visible={logoutModalVisible}
				animationType='fade'
				transparent={true}
				onRequestClose={() => setLogoutModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>Log out</Text>
						<Text style={styles.modalMessage}>
							Are you sure you want to log out? You'll need to log in again to
							use the app.
						</Text>
						<View style={styles.modalButtons}>
							<PrimaryButton
								title='Cancel'
								onPress={() => setLogoutModalVisible(false)}
								variant='secondary'
								style={{ flex: 1, margin: 5 }}
							/>
							<PrimaryButton
								title='Log out'
								onPress={handleLogout}
								variant='primary'
								style={{ flex: 1, margin: 5 }}
							/>
						</View>
					</View>
				</View>
			</Modal>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		paddingTop: height * 0.08,
	},
	menu: {
		marginVertical: 20,
		paddingHorizontal: 20,
	},
	menuItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 15,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	menuText: {
		fontSize: 16,
		color: '#333',
	},
	menuIcon: {
		fontSize: 12,
		color: '#999',
	},
	accountInfo: {
		paddingVertical: 10,
		paddingHorizontal: 15,
		backgroundColor: '#f9f9f9',
		borderRadius: 5,
		marginBottom: 10,
	},
	infoText: {
		fontSize: 14,
		color: '#555',
		marginBottom: 5,
	},
	logoutButton: {
		marginHorizontal: 20,
		marginTop: 20,
		marginBottom: 40,
		alignItems: 'center',
		padding: 15,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#6ba32d',
	},
	logoutButtonText: {
		color: '#6ba32d',
		fontSize: 16,
		fontWeight: '600',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContainer: {
		width: width * 0.8,
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 20,
		alignItems: 'center',
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 10,
		color: '#333',
	},
	modalMessage: {
		fontSize: 16,
		color: '#555',
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 22,
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
})

export default ProfileScreen
