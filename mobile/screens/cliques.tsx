import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Image,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { cliquesService } from '../services';
import { showError } from '../store/app.store';
import { useAuthStore } from '../store/auth.store';
import { Clique } from '../types';
import { RootStackParamList } from '../types';

const { height, width } = Dimensions.get('window');

type CliquesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Cliques'
>;

const Cliques: React.FC = () => {
  const navigation = useNavigation<CliquesScreenNavigationProp>();
  const user = useAuthStore((state) => state.user);

  const [cliques, setCliques] = useState<Clique[]>([]);
  const [filteredCliques, setFilteredCliques] = useState<Clique[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Fetch cliques
  const fetchCliques = async () => {
    try {
      const data = await cliquesService.getAllCliques();
      setCliques(data);
      setFilteredCliques(data);
    } catch (error) {
      console.error('Error fetching cliques:', error);
      showError('Failed to load cliques. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCliques();
  }, []);

  // Search filter
  useEffect(() => {
    if (search.trim()) {
      const filtered = cliques.filter((clique) => {
        const name = clique.name?.toLowerCase() || '';
        const description = clique.description?.toLowerCase() || '';
        const occupation = clique.occupation?.toLowerCase() || '';
        const searchTerm = search.toLowerCase();

        return (
          name.includes(searchTerm) ||
          description.includes(searchTerm) ||
          occupation.includes(searchTerm)
        );
      });
      setFilteredCliques(filtered);
    } else {
      setFilteredCliques(cliques);
    }
  }, [search, cliques]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCliques();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Navigate to clique detail
  const navigateToClique = (cliqueId: number) => {
    navigation.navigate('Clique' as never, { id: cliqueId } as never);
  };

  // Navigate to create clique
  const navigateToCreateClique = () => {
    navigation.navigate('CreateClique' as never);
  };

  // Render clique item
  const renderClique = ({ item }: { item: Clique }) => {
    const memberCount = item.members?.length || 0;
    const isPublic = item.level === 'PUBLIC';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigateToClique(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.badge, isPublic ? styles.publicBadge : styles.privateBadge]}>
              <Text style={styles.badgeText}>
                {isPublic ? 'Public' : 'Private'}
              </Text>
            </View>
          </View>

          {item.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Occupation:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.occupation || 'General'}
              </Text>
            </View>

            <View style={styles.memberInfo}>
              <Text style={styles.memberCount}>
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Cliques Found</Text>
      <Text style={styles.emptyText}>
        {search.trim()
          ? 'No cliques match your search.'
          : 'Be the first to create a clique!'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
        <Text style={styles.loadingText}>Loading cliques...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          style={styles.searchBar}
          placeholder="Search cliques..."
          value={search}
          onChangeText={setSearch}
          iconColor="#6ba32d"
        />
      </View>

      {/* Create Clique Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={navigateToCreateClique}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>+ Create Clique</Text>
      </TouchableOpacity>

      {/* Results Count */}
      {search.trim() && (
        <Text style={styles.resultsCount}>
          Found {filteredCliques.length}{' '}
          {filteredCliques.length === 1 ? 'clique' : 'cliques'}
        </Text>
      )}

      {/* Cliques List */}
      <FlatList
        data={filteredCliques}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderClique}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6ba32d']}
            tintColor="#6ba32d"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: height * 0.08,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  createButton: {
    backgroundColor: '#6ba32d',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resultsCount: {
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publicBadge: {
    backgroundColor: '#DEF7EC',
  },
  privateBadge: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 13,
    color: '#6ba32d',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#6ba32d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default Cliques;
