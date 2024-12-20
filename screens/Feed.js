import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, ScrollView, TextInput, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

function Feed() {
  const [posts, setPosts] = useState([]);

  const navigation = useNavigation();

  useEffect(() => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/post-list')
      .then((response) => response.json())
      .then((data) => setPosts(data))
      .catch((error) => console.error('Error fetching posts:', error));
  }, []);

  const renderPosts = ({ item }) => (
    <View style={styles.postContainer}>
      <TouchableOpacity
        style={styles.postTouchable}
        onPress={() => navigation.navigate('PostDetail', { id: item.id })}>
        <View style={styles.postHeader}>
          <Image source={{ uri: 'https://via.placeholder.com/50' }} style={styles.postImage} />
          <View>
            <Text style={styles.postTitle}>{item.clique}</Text>
            <Text style={styles.postSubtitle}>{item.occupier}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        <TouchableOpacity style={styles.filterButtonActive}><Text style={styles.filterTextActive}>ALL</Text></TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}><Text style={styles.filterText}>PAINTER</Text></TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}><Text style={styles.filterText}>PERSONAL TRAINER</Text></TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}><Text style={styles.filterText}>PT</Text></TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}><Text style={styles.filterText}>TOUR GUIDE</Text></TouchableOpacity>
      </ScrollView>

      <Text style={styles.sectionTitle}>Posts</Text>

      <FlatList
        data={posts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderPosts}
      />

      <Text style={styles.sectionTitle}>Near you</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nearYouContainer}>
        <View style={styles.nearYouCard}>
          <View style={styles.cardHeader}>
            <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.cardImage} />
            <Text style={styles.dateBadge}>MAR 05</Text>
          </View>
          <Text style={styles.cardTitle}>Wouter Wesseling</Text>
          <Text style={styles.cardSubtitle}>Painter</Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.nearYouCard}>
          <View style={styles.cardHeader}>
            <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.cardImage} />
            <Text style={styles.dateBadge}>MAR 05</Text>
          </View>
          <Text style={styles.cardTitle}>Jasper Wester</Text>
          <Text style={styles.cardSubtitle}>Trash man</Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  horizontalScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#6ba32d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#374151',
  },
  filterTextActive: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  nearYouContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  nearYouCard: {
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
  dateBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#6ba32d',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
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
  postContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  postSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default Feed;