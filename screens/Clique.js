import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const Clique = () => {
  const [clique, setClique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Posts');

  const getClique = () => {
    axios
      .get(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/Painters/posts')
      .then((response) => {
        const myClique = response.data.posts;
        setClique(myClique);
      })
      .catch((error) => console.log(error))
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => getClique(), []);

  const renderClique = ({ item }) => {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.imagePlaceholder} />
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderReviews = () => {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Reviews coming soon...</Text>
      </View>
    );
  };

  const renderCliqueInfo = () => {
    return (
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Clique Name: Creative Designers Hub</Text>
        <Text style={styles.infoText}>Description: A hub for creative designers to share and collaborate on projects.</Text>
        <Text style={styles.infoText}>Members: 150</Text>
        <Text style={styles.infoText}>Founded: 2021</Text>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Creative Designers Hub</Text>
      </View>
      <View style={styles.tabContainer}>
        {['Posts', 'Reviews', 'Clique info'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <>
          {activeTab === 'Posts' && (
            <FlatList
              data={clique}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderClique}
              contentContainerStyle={styles.listContainer}
            />
          )}
          {activeTab === 'Reviews' && renderReviews()}
          {activeTab === 'Clique info' && renderCliqueInfo()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: height * 0.08, // Add padding to avoid content getting under the dynamic island
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchIcon: {
    fontSize: 18,
    color: '#007bff',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePlaceholder: {
    height: 100,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
  },
  infoContainer: {
    padding: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
});

export default Clique;