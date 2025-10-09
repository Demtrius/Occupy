import React from 'react'
import { View, Text, StyleSheet, Modal, Dimensions } from 'react-native'
import { PrimaryButton } from '../ui/primary-button'

const { width } = Dimensions.get('window')

interface LogoutModalProps {
	visible: boolean
	onClose: () => void
	onLogout: () => void
}

const LogoutModal: React.FC<LogoutModalProps> = ({
	visible,
	onClose,
	onLogout,
}) => {
	return (
		<Modal
			visible={visible}
			animationType='fade'
			transparent={true}
			onRequestClose={onClose}
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
							onPress={onClose}
							variant='secondary'
							style={{ flex: 1, margin: 5 }}
						/>
						<PrimaryButton
							title='Log out'
							onPress={onLogout}
							variant='primary'
							style={{ flex: 1, margin: 5 }}
						/>
					</View>
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
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

export { LogoutModal }