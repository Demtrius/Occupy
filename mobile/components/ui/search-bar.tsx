import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Searchbar } from "react-native-paper";

const { width } = Dimensions.get("window");

interface SearchBarProps {
	value: string;
	onChangeText: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText }) => {
	return (
		<Searchbar
			style={styles.searchBar}
			placeholder="Search"
			value={value}
			onChangeText={onChangeText}
		/>
	);
};

const styles = StyleSheet.create({
	searchBar: {
		marginHorizontal: width * 0.04,
		borderRadius: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
});

export { SearchBar };
