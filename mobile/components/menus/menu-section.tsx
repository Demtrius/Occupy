import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { ScreenNavigationProp } from '../../types'
import type { User } from '../../types'

interface MenuSectionProps {
	showAccountInfo: boolean
	toggleAccountInfo: () => void
	showAppearanceInfo: boolean
	toggleAppearanceInfo: () => void
	showLanguageInfo: boolean
	toggleLanguageInfo: () => void
	navigation: ScreenNavigationProp<'Profile'>
	user: User | null
}

const MenuSection: React.FC<MenuSectionProps> = ({
	showAccountInfo,
	toggleAccountInfo,
	showAppearanceInfo,
	toggleAppearanceInfo,
	showLanguageInfo,
	toggleLanguageInfo,
	navigation,
	user,
}) => {
	return (
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

			<TouchableOpacity style={styles.menuItem} onPress={toggleAppearanceInfo}>
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
	)
}

const styles = StyleSheet.create({
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
})

export { MenuSection }