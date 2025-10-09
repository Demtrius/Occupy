import React from 'react'
import { Dimensions, ScrollView, StyleSheet } from 'react-native'
import { Button } from 'react-native-paper'
import type { Clique } from '../../types'

const { width, height } = Dimensions.get('window')

interface CategoryFilterProps {
	cliques: Clique[]
	category: number | 'all'
	onFilter: (category: number | 'all') => void
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
	cliques,
	category,
	onFilter,
}) => {
	return (
		<ScrollView
			horizontal={true}
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.scrollViewContent}
			style={styles.categoryContainer}
		>
			<Button
				mode={category === 'all' ? 'contained' : 'outlined'}
				onPress={() => onFilter('all')}
				color='#6ba32d'
				contentStyle={styles.buttonContent}
				style={styles.button}
			>
				All
			</Button>
			{cliques.map(clique => (
				<Button
					key={clique.id}
					mode={category === clique.id ? 'contained' : 'outlined'}
					onPress={() => onFilter(clique.id)}
					color='#6ba32d'
					contentStyle={styles.buttonContent}
					style={styles.button}
				>
					{clique.name}
				</Button>
			))}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	categoryContainer: {
		marginVertical: height * 0.01,
		paddingHorizontal: width * 0.01,
		minHeight: 36,
		maxHeight: 36,
	},
	scrollViewContent: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingHorizontal: width * 0.04,
	},
	button: {
		borderRadius: 20,
		paddingHorizontal: 0,
		marginRight: 10,
	},
	buttonContent: {
		paddingVertical: 0,
		paddingHorizontal: 0,
	},
})

export { CategoryFilter }
