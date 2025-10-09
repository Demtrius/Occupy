import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import type { Clique } from '../../types'

type TabType = 'About' | 'Services' | 'Availability' | 'Bookings' | 'Posts' | 'Reviews'

interface TabBarProps {
  clique: Clique | null
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  isOwner: boolean
  isMember: boolean
}

const TabBar: React.FC<TabBarProps> = ({
  clique,
  activeTab,
  onTabChange,
  isOwner,
  isMember,
}) => {
  const getTabs = (): TabType[] => {
    const baseTabs: TabType[] = ['About', 'Services', 'Posts', 'Reviews']

    if (clique?.isPublic || isMember) {
      baseTabs.splice(2, 0, 'Availability')
    }

    if (isOwner) {
      baseTabs.splice(3, 0, 'Bookings')
    }

    return baseTabs
  }

  return (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {getTabs().map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => onTabChange(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsScrollContent: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6ba32d',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6ba32d',
    fontWeight: '600',
  },
})

export default TabBar