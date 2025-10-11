import React from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Clique } from '../../types'
import { PrimaryButton } from '../ui/primary-button'

interface CliqueHeaderProps {
  clique: Clique
  isOwner: boolean
  isLoggedIn: boolean
  isMember: boolean
  joiningClique: boolean
  onBack: () => void
  onJoinLeave: () => void
}

const CliqueDetailHeader: React.FC<CliqueHeaderProps> = ({
  clique,
  isOwner,
  isLoggedIn,
  isMember,
  joiningClique,
  onBack,
  onJoinLeave,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backIcon} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        {clique.image ? (
          <Image source={{ uri: clique.image }} style={styles.cliqueImage} />
        ) : (
          <View style={styles.cliqueImagePlaceholder}>
            <Ionicons name="people" size={32} color="#9CA3AF" />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.cliqueName}>{clique.name}</Text>
          <Text style={styles.cliqueInfo}>
            {clique.membersCount || 0} members
          </Text>
        </View>
      </View>
      {!isOwner && isLoggedIn && (
        <PrimaryButton
          title={isMember ? "Leave" : "Join"}
          onPress={onJoinLeave}
          disabled={joiningClique}
          loading={joiningClique}
          variant={isMember ? "danger" : "success"}
          style={{
            paddingVertical: 4,
            paddingHorizontal: 12,
            minWidth: 70,
            margin: 0,
          }}
          textStyle={{ fontSize: 14 }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backIcon: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cliqueImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  cliqueImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  cliqueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cliqueInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
})

export default CliqueDetailHeader