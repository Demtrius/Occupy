import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Searchbar as PaperSearchbar, Button } from 'react-native-paper';
import axios from 'axios';
import { Context } from '../components/globalContext/globalContext';

const { width, height } = Dimensions.get('window');

function Search(props) {
  const globalContext = useContext(Context);
  const { user } = globalContext;
  const [search, setSearch] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [masterDataSource, setMasterDataSource] = useState([]);
  const [cliques, setCliques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  const [userList, setUsersList] = useState([]);
  
  const getCliques = () => {
    axios.get(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/cliques-list')
      .then((response) => {
        const myCliques = response.data;
        setCliques(myCliques);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => getCliques(), []);

  const getUsers = () => {
    axios.get(process.env.EXPO_PUBLIC_BACKEND_URL + '/auth/occupier-list')
      .then((response) => {
        const users = response.data;
        setUsersList(users);
      })
      .catch((error) => console.error(error));
  };  
  useEffect(() => getUsers(), []);

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

  useEffect(() => {
    getCliques();
    getUsers();
  }, []);

  useEffect(() => {
    if (category === 'all') {
      const allData = [
        ...masterDataSource.map(item => ({ ...item, type: 'Occupation' })),
        ...userList.map(user => ({ ...user, type: 'User' })),
        ...cliques.map(clique => ({ ...clique, type: 'Clique' }))
      ];
      setFilteredDataSource(allData);
    }
  }, [masterDataSource, userList, cliques]);

  const searchFilterFunction = (text) => {
    if (text) {
      let newData = [];
  
      if (category === 'all') {
        newData = [
          ...masterDataSource
            .filter((item) => item.name.toUpperCase().includes(text.toUpperCase()))
            .map((item) => ({ ...item, type: 'Occupation' })),
          ...userList
            .filter((user) => user.username.toUpperCase().includes(text.toUpperCase()))
            .map((user) => ({ ...user, type: 'User' })),
          ...cliques
            .filter((clique) => clique.name.toUpperCase().includes(text.toUpperCase()))
            .map((clique) => ({ ...clique, type: 'Clique' })),
        ];
      } else if (category === 'Occupation') {
        newData = masterDataSource
          .filter((item) => item.name.toUpperCase().includes(text.toUpperCase()))
          .map((item) => ({ ...item, type: 'Occupation' }));
      } else if (category === 'Persons') {
        newData = userList
          .filter((user) => user.username.toUpperCase().includes(text.toUpperCase()))
          .map((user) => ({ ...user, type: 'User' }));
      } else if (category === 'Cliques') {
        newData = cliques
          .filter((clique) => clique.name.toUpperCase().includes(text.toUpperCase()))
          .map((clique) => ({ ...clique, type: 'Clique' }));
      }
  
      setFilteredDataSource(newData);
      setSearch(text);
    } else {
      filterByCategory(category);
      setSearch(text);
    }
  };

  const filterByCategory = (category) => {
    setCategory(category);
    if (category === 'all') {
      const allData = [
        ...masterDataSource.map(item => ({ ...item, type: 'Occupation' })),
        ...userList.map(user => ({ ...user, type: 'User' })),
        ...cliques.map(clique => ({ ...clique, type: 'Clique' }))
      ];
      setFilteredDataSource(allData);
    } else if (category === 'Occupation') {
      const newData = masterDataSource.map(item => ({ ...item, type: 'Occupation' })).filter((item) => item.type === 'Occupation');
      setFilteredDataSource(newData);
    } else if (category === 'Persons') {
      setFilteredDataSource(userList.map(user => ({ ...user, type: 'User' })));
    } else if (category === 'Cliques') {
      setFilteredDataSource(cliques.map(clique => ({ ...clique, type: 'Clique' })));
    }
  };

  const ItemView = ({ item }) => {
    let itemType = item.type;
    if (!itemType) {
      if (item.category) {
        itemType = 'Occupation';
      } else if (item.username) {
        itemType = 'User';
      } else if (item.clique) {
        itemType = 'Clique';
      }
    }
  
    let displayName = 'Unnamed';
    if (item.type === 'User') {
      displayName = item.username ?? 'Unknown User';
    } else {
      displayName = item.name ?? (itemType === 'Occupation' ? 'Unnamed Occupation' : 'Unnamed Clique');
    }
  
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{displayName}</Text>
        <Text style={styles.itemType}>{itemType ?? 'Unknown Type'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PaperSearchbar
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
          <Text>All</Text>
        </Button>
        <Button
          mode={category === 'Occupation' ? 'contained' : 'outlined'}
          onPress={() => filterByCategory('Occupation')}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          <Text>Occupation</Text>
        </Button>
        <Button
          mode={category === 'Persons' ? 'contained' : 'outlined'}
          onPress={() => filterByCategory('Persons')}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          <Text>Persons</Text>
        </Button>
        <Button
          mode={category === 'Cliques' ? 'contained' : 'outlined'}
          onPress={() => filterByCategory('Cliques')}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          <Text>Cliques</Text>
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
    paddingTop: height * 0.08, // Add padding to avoid content getting under the dynamic island
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
    paddingHorizontal: width * 0.01,
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 0,
    marginRight: 1, // Add margin to the right for spacing
  },
  buttonContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  itemsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: width * 0.04,
    marginTop: height * 0.02,
  },
  itemType: {
    fontSize: 14,
    color: 'grey',
  },
});

export default Search;
export { PaperSearchbar as Searchbar };
