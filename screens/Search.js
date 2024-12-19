import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Searchbar } from 'react-native-paper';

function Search(props) {
  const [search, setSearch] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [masterDataSource, setMasterDataSource] = useState([]);

  useEffect(() => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/search')
      .then((response) => response.json())
      .then((responseJson) => {
        setFilteredDataSource(responseJson);
        setMasterDataSource(responseJson);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const searchFilterFunction = (text) => {
    if (text) {
      const newData = masterDataSource.filter((item) => {
        const itemData = item.name
          ? item.name.toUpperCase()
          : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredDataSource(newData);
      setSearch(text);
    } else {
      setFilteredDataSource(masterDataSource);
      setSearch(text);
    }
  };

  const ItemView = ({ item }) => {
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{item.name}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        style={styles.searchBar}
        placeholder="Search"
        value={search}
        onChangeText={(text) => searchFilterFunction(text)}
      />
      <FlatList
        data={filteredDataSource}
        keyExtractor={(item, index) => index.toString()}
        renderItem={ItemView}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingTop: 20,
  },
  searchBar: {
    marginHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // For Android shadow
  },
  itemText: {
    fontSize: 16,
    color: '#333333',
  },
});

export default Search;
