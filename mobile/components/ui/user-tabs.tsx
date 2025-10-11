import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface UserTabsProps {
  activeTab: 'Posts' | 'Reviews'
  onTabPress: (tab: 'Posts' | 'Reviews') => void
}

const UserTabs: React.FC<UserTabsProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'Posts' && styles.activeTab]}
        onPress={() => onTabPress('Posts')}
      >
        <Text style={[styles.tabText, activeTab === 'Posts' && styles.activeTabText]}>
          Posts
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'Reviews' && styles.activeTab]}
        onPress={() => onTabPress('Reviews')}
      >
        <Text style={[styles.tabText, activeTab === 'Reviews' && styles.activeTabText]}>
          Reviews
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6ba32d',
  },
  tabText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#6ba32d',
    fontWeight: 'bold',
  },
})

export default UserTabs