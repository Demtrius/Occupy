import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Searchbar, Button } from 'react-native-paper';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

function Search(props) {
  const [search, setSearch] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [masterDataSource, setMasterDataSource] = useState([]);
  const [cliques, setCliques] = useState([])
  const [loading,setLoading] = useState(true)

  const getCliques = () => {
    axios.get(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/cliques-list')
    .then((response) => {
        const myCliques = response.data;
        setCliques(myCliques)
    })
    .catch((error) => console.error(error))
    .finally(() => {
        setLoading(false)
    })
  }
  useEffect(() => getCliques(), [])


  const [category, setCategory] = useState('all');

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

  const filterByCategory = (category) => {
    setCategory(category);
    if (category === 'all') {
      setFilteredDataSource(masterDataSource);
    } else {
      const newData = masterDataSource.filter((item) => item.category === category);
      setFilteredDataSource(newData);
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
      <View style={styles.categoryContainer}>
        <Button
          mode={category === 'all' ? 'contained' : 'outlined'}
          onPress={() => filterByCategory('all')}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          All
        </Button>
        <Button
          mode={category === 'Occupation' ? 'contained' : 'outlined'}
          onPress={() => filterByCategory('Occupation')}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          Occupation
        </Button>
        <Button
          mode={category === 'Persons' ? 'contained' : 'outlined'}
          onPress={() => filterByCategory('Persons')}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          Persons
        </Button>
        <Button
          mode={category === 'groups' ? 'contained' : 'outlined'}
          onPress={() => filterByCategory('groups')}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          groups
        </Button>
      </View>
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
    backgroundColor: 'white',
    paddingTop: height * 0.02,
  },
  searchBar: {
    marginHorizontal: width * 0.04,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  listContainer: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.01,
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: width * 0.04,
    marginBottom: height * 0.01,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // For Android shadow
  },
  itemText: {
    fontSize: width * 0.04,
    color: '#333333',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 0,
  },
  buttonContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});

export default Search;
