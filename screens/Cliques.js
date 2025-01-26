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

  const renderCliques = ({ item }) => {
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Clique', { id: item.id})}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: 'https://placecats.com/300/200' }} style={styles.cardImage} />
        </View>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>{item.location}</Text>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>open clique</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <PaperSearchbar
          style={styles.searchBar}
          placeholder="Search"
          value={search}
          onChangeText={(text) => searchFilterFunction(text)}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Category 1</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateClique')}
            >
              <Ionicons name="add-circle" size={32} color="#6ba32d" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredDataSource}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderCliques}
            contentContainerStyle={styles.list}
            horizontal // Align items horizontally
          />
          <Text style={styles.categoryTitle}>Category 2</Text>
          <FlatList
            data={filteredDataSource}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderCliques}
            contentContainerStyle={styles.list}
            horizontal // Align items horizontally
          />
          <Text style={styles.categoryTitle}>Category 3</Text>
          <FlatList
            data={filteredDataSource}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderCliques}
            contentContainerStyle={styles.list}
            horizontal // Align items horizontally
          />
          <Text style={styles.categoryTitle}>Category 4</Text>
          <FlatList
            data={filteredDataSource}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderCliques}
            contentContainerStyle={styles.list}
            horizontal // Align items horizontally
          />
        </ScrollView>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    marginRight: 16,
    width: width * 0.4,
    padding: 16,
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
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 20,
  },
  addButton: {
    marginRight: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
});

export default Cliques;