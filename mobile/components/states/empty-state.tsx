import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { FontAwesome } from '@expo/vector-icons'
import { PrimaryButton } from '../ui/primary-button'
import type { ScreenNavigationProp } from '../../types'

interface EmptyStateProps {
	message?: string
	actionText?: string
	onAction?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({
	message = 'No content available',
	actionText = 'Explore',
	onAction,
}) => {
	const navigation = useNavigation<ScreenNavigationProp<'Home'>>()

	const handleAction = () => {
		if (onAction) {
			onAction()
		} else {
			navigation.navigate('CliquesTab')
		}
	}

	return (
		<View style={styles.container}>
			<FontAwesome name='newspaper-o' size={64} color='#ccc' />
			<Text style={styles.title}>No Posts Yet</Text>
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
		padding: 32,
	},
	title: {
		fontSize: 20,
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

export { EmptyState }