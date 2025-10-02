import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView, Image } from 'react-native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the "+" button

const { height, width } = Dimensions.get('window');

function Cliques({ navigation }) {
  const [cliques, setCliques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredDataSource, setFilteredDataSource] = useState([]);
  const [masterDataSource, setMasterDataSource] = useState([]);
  const [refreshing, setRefreshing] = useState(false)

  const getCliques = () => {
    axios
      .get(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/cliques-list')
      .then((response) => {
        const myCliques = response.data;
        setCliques(myCliques);
        setFilteredDataSource(myCliques);
        setMasterDataSource(myCliques);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => getCliques(), []);

  const onRefresh = () => {
    setRefreshing(true)
    getCliques();
  };

  const searchFilterFunction = (text) => {
    if (text) {
      const newData = masterDataSource.filter((item) => {
        const itemData = item.name ? item.name.toUpperCase() : ''.toUpperCase();
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

  const renderCliques = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Clique", { id: item.id })}
    >
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>{item.location}</Text>
    </TouchableOpacity>
  );



   return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("CreateClique")}
      >
        <Text style={styles.addButtonText}>+ Create Clique</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={cliques}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCliques}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    paddingTop: height * 0.08, // Add padding to avoid content getting under the dynamic island
  },
  searchBarContainer: {
    alignItems: 'center', // Center the search bar
    marginBottom: 16, // Add margin to separate from the list
  },
  searchBar: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
    width: width * 0.92, // Ensure the same width as on Search.js
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cardHeader: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactButton: {
    borderWidth: 1,
    borderColor: '#6ba32d',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 14,
    color: '#6ba32d',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: "#6ba32d",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardSubtitle: { fontSize: 14, color: "#666" },
  list: { paddingBottom: 20 },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default Cliques;
