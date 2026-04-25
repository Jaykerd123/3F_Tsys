import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { logout, updateUserProfile, subscribeUserLogs, deleteTimeLog } from '../../services/firebase'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function ProfileScreen({ user, profile }) {
  const [name, setName] = useState(profile?.name || '')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setName(profile?.name || '')
  }, [profile?.name])

  useEffect(() => {
    const unsubscribe = subscribeUserLogs(user.uid, setLogs)
    return unsubscribe
  }, [user.uid])

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        try {
          await logout()
        } catch (error) {
          Alert.alert('Logout failed', error.message)
        }
      }}
    ])
  }

  const handleSave = async () => {
    if (!name.trim()) return
    try {
      setLoading(true)
      await updateUserProfile(user.uid, { name: name.trim() })
      Alert.alert('Success', 'Your profile has been updated.')
    } catch (error) {
      Alert.alert('Update failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLog = async id => {
    Alert.alert('Delete Session', 'Remove this time log from your history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await deleteTimeLog(id)
        } catch (error) {
          Alert.alert('Delete failed', error.message)
        }
      }}
    ])
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.name ? profile.name[0].toUpperCase() : '?'}</Text>
        </View>
        <Pressable style={styles.editAvatarBtn}>
          <MaterialCommunityIcons name="camera-outline" size={16} color="#fff" />
        </Pressable>
      </View>
      <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{profile?.role || 'Worker'}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <>
            {renderHeader()}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Settings</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.disabledInput}>
                    <MaterialCommunityIcons name="email-outline" size={20} color="#999" />
                    <Text style={styles.disabledInputText}>{user.email}</Text>
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="account-outline" size={20} color="#007AFF" />
                    <TextInput 
                      style={styles.input} 
                      value={name} 
                      onChangeText={setName} 
                      placeholder="Enter your name"
                    />
                  </View>
                </View>

                <Pressable 
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.buttonPressed,
                    loading && styles.buttonDisabled
                  ]} 
                  onPress={handleSave}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Session History</Text>
              <Text style={styles.logCount}>{logs.length} Total</Text>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <View style={styles.logIcon}>
              <MaterialCommunityIcons name="clock-check-outline" size={20} color="#4CD964" />
            </View>
            <View style={styles.logInfo}>
              <Text style={styles.logDate}>
                {new Date(item.timeIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.logTime}>
                {new Date(item.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {item.timeOut 
                  ? new Date(item.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Active'}
              </Text>
            </View>
            <Pressable style={styles.deleteBtn} onPress={() => handleDeleteLog(item.id)}>
              <MaterialCommunityIcons name="close-circle-outline" size={22} color="#FF3B30" />
            </Pressable>
          </View>
        )}
        ListFooterComponent={() => (
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sessions found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#007AFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  logCount: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  disabledInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  disabledInputText: {
    marginLeft: 10,
    color: '#999',
    fontSize: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#eee',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logDate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  logTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE3E3',
  },
  logoutText: {
    marginLeft: 8,
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
})
