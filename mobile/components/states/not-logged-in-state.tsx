import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { FontAwesome } from '@expo/vector-icons'
import { PrimaryButton } from '../ui/primary-button'
import type { ScreenNavigationProp } from '../../types'

interface NotLoggedInStateProps {
	message?: string
	actionText?: string
	onAction?: () => void
}

const NotLoggedInState: React.FC<NotLoggedInStateProps> = ({
	message = 'Sign in to see your personalized feed',
	actionText = 'Sign In',
	onAction,
}) => {
	const navigation = useNavigation<ScreenNavigationProp<'Home'>>()

	const handleAction = () => {
		if (onAction) {
			onAction()
		} else {
			navigation.navigate('SignIn')
		}
	}

	return (
		<View style={styles.container}>
			<FontAwesome name='lock' size={64} color='#ccc' />
			<Text style={styles.title}>Please Sign In</Text>
			<Text style={styles.text}>{message}</Text>
			<PrimaryButton
				title={actionText}
				onPress={handleAction}
				style={{ marginHorizontal: 0, width: '100%', marginTop: 24 }}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f5f5f5',
		padding: 32,
	},
	title: {
		fontSize: 24,
		fontWeight: '600',
		color: '#333',
		marginTop: 16,
		marginBottom: 8,
	},
	text: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
	},
})

export { NotLoggedInState }