import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import DropDownPicker from 'react-native-dropdown-picker'
import { FormInput } from '../ui/form-input'
import { FormLabel } from '../ui/form-label'
import { FormActions } from '../ui/form-actions'
import { type Option, OptionGrid } from '../ui/option-grid'
import { Colors, Spacing, Typography } from '../../theme'

interface PostFormValues {
	caption: string
	content: string
	selectedCliqueId: number | null
	selectedLanguage: string
}

interface PostFormProps {
	values: PostFormValues
	errors: Partial<Record<keyof PostFormValues, string>>
	handleChange: (name: keyof PostFormValues, value: any) => void
	cliqueOptions: { label: string; value: number }[]
	onSubmit?: () => void
	isSubmitting?: boolean
}

const PostForm: React.FC<PostFormProps> = ({
	values,
	errors,
	handleChange,
	cliqueOptions,
	onSubmit,
	isSubmitting = false,
}) => {
	const [open, setOpen] = useState<boolean>(false)

	const languageOptions: Option[] = [
		{ value: 'ALL', label: 'All' },
		{ value: 'ENGLISH', label: 'English' },
		{ value: 'DUTCH', label: 'Dutch' },
		{ value: 'GERMAN', label: 'German' },
	]

	return (
		<>
			{/* Post Content */}
			<View style={styles.inputGroup}>
				<FormLabel>Post Content</FormLabel>
				<FormInput
					value={values.content}
					onChangeText={text => handleChange('content', text)}
					placeholder='Share something with your clique...'
					multiline
					numberOfLines={5}
					style={styles.contentInput}
					maxLength={500}
					showCharacterCount
				/>
				{errors.caption && (
					<Text style={styles.errorText}>{errors.caption}</Text>
				)}
			</View>

			{/* Additional Details */}
			<View style={styles.inputGroup}>
				<FormLabel>Additional Details (Optional)</FormLabel>
				<FormInput
					value={values.caption}
					onChangeText={text => handleChange('caption', text)}
					placeholder='Any additional information...'
					multiline
					numberOfLines={3}
					style={styles.captionInput}
				/>
			</View>

			{/* Language Selection */}
			<View style={styles.inputGroup}>
				<FormLabel>Language</FormLabel>
				<OptionGrid
					options={languageOptions}
					selectedValue={values.selectedLanguage}
					onSelect={value => handleChange('selectedLanguage', value)}
				/>
			</View>

			{/* Clique Selection */}
			<View style={styles.inputGroup}>
				<FormLabel>Choose a Clique</FormLabel>
				<DropDownPicker
					open={open}
					value={values.selectedCliqueId}
					items={cliqueOptions}
					setOpen={setOpen}
					setValue={() => {}}
					setItems={() => {}}
					onSelectItem={item => handleChange('selectedCliqueId', item.value)}
					style={styles.dropdown}
					placeholder='Select a clique to post in'
					dropDownContainerStyle={styles.dropdownContainer}
					listMode='SCROLLVIEW'
					scrollViewProps={{
						nestedScrollEnabled: true,
					}}
				/>
				{errors.selectedCliqueId && (
					<Text style={styles.errorText}>{errors.selectedCliqueId}</Text>
				)}
			</View>

			{onSubmit && (
				<FormActions
					submitTitle='Create Post'
					onSubmit={onSubmit}
					isSubmitting={isSubmitting}
					showCancel={false}
				/>
			)}
		</>
	)
}

const styles = StyleSheet.create({
	inputGroup: {
		marginBottom: Spacing.lg,
	},
	captionInput: {
		minHeight: 80,
	},
	contentInput: {
		minHeight: 120,
	},
	dropdown: {
		borderColor: Colors.border,
		borderRadius: 8,
		backgroundColor: Colors.white,
	},
	dropdownContainer: {
		borderColor: Colors.border,
		maxHeight: 200,
	},
	errorText: {
		...Typography.caption,
		color: Colors.error,
		marginTop: Spacing.xs,
	},
})

export { PostForm }
