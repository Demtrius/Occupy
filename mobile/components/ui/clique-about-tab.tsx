import React from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Clique } from '../../types'

interface CliqueAboutTabProps {
  clique: Clique
  servicesCount: number
  refreshing: boolean
  onRefresh: () => void
}

const CliqueAboutTab: React.FC<CliqueAboutTabProps> = ({
  clique,
  servicesCount,
  refreshing,
  onRefresh,
}) => {
  return (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#6ba32d"
          colors={["#6ba32d"]}
        />
      }
    >
      <View style={styles.aboutContainer}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {clique.description || "No description available"}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={24} color="#6ba32d" />
            <Text style={styles.statNumber}>{clique.membersCount || 0}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="document-text" size={24} color="#6ba32d" />
            <Text style={styles.statNumber}>{clique.postsCount || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={24} color="#6ba32d" />
            <Text style={styles.statNumber}>{servicesCount}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
        </View>

        {clique.createdAt && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              Created {new Date(clique.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
  aboutContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
})

export default CliqueAboutTab