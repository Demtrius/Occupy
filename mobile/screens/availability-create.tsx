import React, { useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Platform,
	Modal,
	TouchableWithoutFeedback,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { availabilityService } from '../services'
import { showError, showSuccess } from '../store/app.store'
import {
	RootStackParamList,
	ScreenNavigationProp,
	ScreenRouteProp,
} from '../types'
import {
	ScreenHeader,
	FormSection,
	FormLabel,
	PrimaryButton,
	InfoBox,
	OptionGrid,
	SwitchRow,
	Option,
} from '../components'
import {
	Colors,
	Spacing,
	Typography,
	BorderRadius,
	CommonStyles,
} from '../theme'

interface Props {
	route: ScreenRouteProp<'AvailabilityCreate'>
}

const DAYS_OF_WEEK: Option[] = [
	{ value: '0', label: 'Sun' },
	{ value: '1', label: 'Mon' },
	{ value: '2', label: 'Tue' },
	{ value: '3', label: 'Wed' },
	{ value: '4', label: 'Thu' },
	{ value: '5', label: 'Fri' },
	{ value: '6', label: 'Sat' },
]

const DAY_NAMES = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
]

type PickerType = 'date' | 'start' | 'end' | null

const AvailabilityCreateScreen: React.FC<Props> = ({ route }) => {
	const navigation = useNavigation<ScreenNavigationProp<'AvailabilityCreate'>>()
	const { cliqueId } = route.params

	const [isRecurring, setIsRecurring] = useState<boolean>(false)
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>('1') // Monday by default
	const [visiblePicker, setVisiblePicker] = useState<PickerType>(null)
	const [startTime, setStartTime] = useState<Date>(new Date())
	const [endTime, setEndTime] = useState<Date>(new Date())
	const [submitting, setSubmitting] = useState<boolean>(false)

	// Initialize times to reasonable defaults
	React.useEffect(() => {
		const now = new Date()
		const start = new Date(now)
		start.setHours(9, 0, 0, 0)
		setStartTime(start)

		const end = new Date(now)
		end.setHours(17, 0, 0, 0)
		setEndTime(end)
	}, [])

	const formatDateForAPI = (date: Date): string => {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	const formatTimeForAPI = (date: Date): string => {
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		return `${hours}:${minutes}:00`
	}

	const formatTimeDisplay = (date: Date): string => {
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		})
	}

	const validateForm = (): boolean => {
		// Check if start time is before end time
		if (startTime >= endTime) {
			showError('Start time must be before end time')
			return false
		}

		// If not recurring, check if the date is in the future
		if (!isRecurring) {
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			const selected = new Date(selectedDate)
			selected.setHours(0, 0, 0, 0)

			if (selected < today) {
				showError('Please select a future date')
				return false
			}
		}

		return true
	}

	const handleCreateAvailability = async () => {
		if (!validateForm()) {
			return
		}

		try {
			setSubmitting(true)

			const availabilityData = {
				cliqueId,
				startTime: formatTimeForAPI(startTime),
				endTime: formatTimeForAPI(endTime),
				isRecurring,
				...(isRecurring
					? { dayOfWeek: parseInt(selectedDayOfWeek) }
					: { date: formatDateForAPI(selectedDate) }),
			}

			await availabilityService.createAvailability(availabilityData)
			showSuccess('Availability created successfully!')
			navigation.goBack()
		} catch (error: any) {
			console.error('Error creating availability:', error)
			showError(error.message || 'Failed to create availability')
		} finally {
			setSubmitting(false)
		}
	}

	const onDateChange = (event: any, newDate?: Date) => {
		const currentDate = newDate || selectedDate
		if (Platform.OS === 'android') {
			setVisiblePicker(null)
		}
		setSelectedDate(currentDate)
	}

	const onStartTimeChange = (event: any, newTime?: Date) => {
		const currentTime = newTime || startTime
		if (Platform.OS === 'android') {
			setVisiblePicker(null)
		}
		setStartTime(currentTime)
	}

	const onEndTimeChange = (event: any, newTime?: Date) => {
		const currentTime = newTime || endTime
		if (Platform.OS === 'android') {
			setVisiblePicker(null)
		}
		setEndTime(currentTime)
	}

	const calculateDuration = () => {
		const durationMs = endTime.getTime() - startTime.getTime()
		const hours = Math.floor(durationMs / (1000 * 60 * 60))
		const minutes = Math.floor((durationMs / (1000 * 60)) % 60)
		return { hours, minutes }
	}

	const duration = calculateDuration()

	const renderPicker = () => {
		if (visiblePicker === null) return null

		const pickerProps: any = {
			value: selectedDate,
			mode: 'date',
			display: Platform.OS === 'ios' ? 'spinner' : 'default',
			onChange: onDateChange,
			minimumDate: new Date(),
		}

		if (visiblePicker === 'start') {
			pickerProps.value = startTime
			pickerProps.mode = 'time'
			pickerProps.onChange = onStartTimeChange
		}

		if (visiblePicker === 'end') {
			pickerProps.value = endTime
			pickerProps.mode = 'time'
			pickerProps.onChange = onEndTimeChange
		}

		if (Platform.OS === 'ios') {
			return (
				<Modal
					transparent={true}
					animationType='fade'
					visible={visiblePicker !== null}
					onRequestClose={() => setVisiblePicker(null)}
				>
					<TouchableWithoutFeedback onPress={() => setVisiblePicker(null)}>
						<View style={styles.modalContainer}>
							<TouchableWithoutFeedback>
								<View style={styles.modalContent}>
									<DateTimePicker {...pickerProps} />
									<PrimaryButton
										title='Done'
										onPress={() => setVisiblePicker(null)}
									/>
								</View>
							</TouchableWithoutFeedback>
						</View>
					</TouchableWithoutFeedback>
				</Modal>
			)
		}

		return <DateTimePicker {...pickerProps} />
	}

	return (
		<View style={CommonStyles.container}>
			<ScreenHeader
				title='Create Availability'
				onBack={() => navigation.goBack()}
			/>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* Recurring Toggle */}
				<FormSection>
					<SwitchRow
						label='Recurring Availability'
						description={
							isRecurring
								? 'Repeats weekly on the selected day'
								: 'One-time availability for a specific date'
						}
						value={isRecurring}
						onValueChange={setIsRecurring}
					/>
				</FormSection>

				{/* Date/Day Selection */}
				<FormSection>
					{isRecurring ? (
						<>
							<FormLabel required>Select Day of Week</FormLabel>
							<OptionGrid
								options={DAYS_OF_WEEK}
								selectedValue={selectedDayOfWeek}
								onSelect={value => setSelectedDayOfWeek(value)}
							/>
							<InfoBox variant='info' style={styles.dayInfoBox}>
								<Text style={styles.infoText}>
									This availability will repeat every{' '}
									{DAY_NAMES[parseInt(selectedDayOfWeek)]}
								</Text>
							</InfoBox>
						</>
					) : (
						<>
							<FormLabel required>Select Date</FormLabel>
							<TouchableOpacity
								style={styles.dateButton}
								onPress={() => setVisiblePicker('date')}
							>
								<Ionicons
									name='calendar-outline'
									size={20}
									color={Colors.primary}
								/>
								<Text style={styles.dateButtonText}>
									{selectedDate.toLocaleDateString('en-US', {
										weekday: 'long',
										year: 'numeric',
										month: 'long',
										day: 'numeric',
									})}
								</Text>
								<Ionicons
									name='chevron-down-outline'
									size={20}
									color={Colors.textTertiary}
								/>
							</TouchableOpacity>
						</>
					)}
				</FormSection>

				{/* Time Selection */}
				<FormSection>
					<FormLabel required>Available Hours</FormLabel>

					{/* Start Time */}
					<View style={styles.timeRow}>
						<View style={styles.timeLabel}>
							<Ionicons
								name='time-outline'
								size={18}
								color={Colors.textSecondary}
							/>
							<Text style={styles.timeLabelText}>From</Text>
						</View>
						<TouchableOpacity
							style={styles.timeButton}
							onPress={() => setVisiblePicker('start')}
						>
							<Text style={styles.timeButtonText}>
								{formatTimeDisplay(startTime)}
							</Text>
							<Ionicons
								name='chevron-down-outline'
								size={18}
								color={Colors.textTertiary}
							/>
						</TouchableOpacity>
					</View>

					{/* End Time */}
					<View style={styles.timeRow}>
						<View style={styles.timeLabel}>
							<Ionicons
								name='time-outline'
								size={18}
								color={Colors.textSecondary}
							/>
							<Text style={styles.timeLabelText}>To</Text>
						</View>
						<TouchableOpacity
							style={styles.timeButton}
							onPress={() => setVisiblePicker('end')}
						>
							<Text style={styles.timeButtonText}>
								{formatTimeDisplay(endTime)}
							</Text>
							<Ionicons
								name='chevron-down-outline'
								size={18}
								color={Colors.textTertiary}
							/>
						</TouchableOpacity>
					</View>

					{/* Duration Display */}
					<View style={styles.durationDisplay}>
						<Ionicons
							name='hourglass-outline'
							size={16}
							color={Colors.primary}
						/>
						<Text style={styles.durationText}>
							Duration: {duration.hours} hours {duration.minutes} minutes
						</Text>
					</View>
				</FormSection>

				{/* Info Box */}
				<InfoBox variant='warning' style={styles.tipBox}>
					<Text style={styles.infoText}>
						Tip: Create multiple availability slots to give clients more booking
						options. You can set different hours for different days.
					</Text>
				</InfoBox>

				{/* Create Button */}
				<PrimaryButton
					title='Create Availability'
					onPress={handleCreateAvailability}
					disabled={submitting}
					loading={submitting}
					style={{ marginTop: Spacing.lg }}
				/>

				<View style={styles.bottomSpacer} />
			</ScrollView>
			{renderPicker()}
		</View>
	)
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		padding: Spacing.lg,
	},
	dateButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.white,
		padding: Spacing.lg,
		borderRadius: BorderRadius.md,
		borderWidth: 1,
		borderColor: Colors.border,
		gap: Spacing.md,
	},
	dateButtonText: {
		...Typography.body,
		color: Colors.textPrimary,
		flex: 1,
	},
	dayInfoBox: {
		marginTop: Spacing.md,
	},
	timeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: Spacing.md,
	},
	timeLabel: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.sm,
	},
	timeLabelText: {
		...Typography.bodyBold,
		color: Colors.textPrimary,
	},
	timeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.white,
		paddingVertical: Spacing.md,
		paddingHorizontal: Spacing.lg,
		borderRadius: BorderRadius.md,
		borderWidth: 1,
		borderColor: Colors.border,
		gap: Spacing.sm,
		minWidth: 140,
	},
	timeButtonText: {
		...Typography.body,
		color: Colors.textPrimary,
		flex: 1,
	},
	durationDisplay: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.gray50,
		padding: Spacing.md,
		borderRadius: BorderRadius.md,
		gap: Spacing.sm,
		marginTop: Spacing.sm,
	},
	durationText: {
		...Typography.small,
		color: Colors.textSecondary,
	},
	tipBox: {
		marginTop: Spacing.lg,
	},
	infoText: {
		...Typography.body,
		color: Colors.textPrimary,
		lineHeight: 20,
	},
	bottomSpacer: {
		height: Spacing.xl,
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.5)',
	},
	modalContent: {
		backgroundColor: 'white',
		padding: 20,
		borderRadius: 20,
		width: '90%',
	},
})

export default AvailabilityCreateScreen
