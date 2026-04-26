import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert, ScrollView, Image, ActivityIndicator, Modal } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { logout, updateUserProfile, subscribeUserLogs, deleteTimeLog } from '../../services/firebase'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function ProfileScreen({ user, profile, theme = 'light', onThemeChange, onProfileUpdate }) {
  const [name, setName] = useState(profile?.name || '')
  const [pfp, setPfp] = useState(profile?.pfp || null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(theme === 'dark')
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false)

  useEffect(() => {
    setName(profile?.name || '')
    setPfp(profile?.pfp || null)
  }, [profile?.name, profile?.pfp])

  useEffect(() => {
    setDarkMode(theme === 'dark')
  }, [theme])

  useEffect(() => {
    const unsubscribe = subscribeUserLogs(user.uid, setLogs)
    return unsubscribe
  }, [user.uid])

  const isDark = theme === 'dark'
  const colors = {
    background: isDark ? '#121212' : '#f8f9fa',
    card: isDark ? '#1e1e1e' : '#fff',
    border: isDark ? '#2a2a2a' : '#eee',
    text: isDark ? '#fff' : '#1a1a1a',
    secondary: isDark ? '#ccc' : '#666',
    muted: isDark ? '#999' : '#999',
    inputBg: isDark ? '#171717' : '#f8f9fa',
    sectionBg: isDark ? '#1b1b1b' : '#fff',
    roleBg: isDark ? '#22303d' : '#E8F2FF',
    roleText: isDark ? '#8ab8ff' : '#007AFF',
    logoutBg: isDark ? '#3a121f' : '#FFF5F5',
    logoutBorder: isDark ? '#5f1f35' : '#FFE3E3',
  }

  const toggleDarkMode = async () => {
    const nextMode = darkMode ? 'light' : 'dark'
    setDarkMode(!darkMode)
    if (typeof onThemeChange === 'function') {
      await onThemeChange(nextMode)
    }
  }

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
      if (typeof onProfileUpdate === 'function') {
        onProfileUpdate({ name: name.trim() })
      }
      Alert.alert('Success', 'Your profile has been updated.')
    } catch (error) {
      Alert.alert('Update failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled) {
        setLoading(true)
        const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`
        await updateUserProfile(user.uid, { pfp: base64Img })
        setPfp(base64Img)
        if (typeof onProfileUpdate === 'function') {
          onProfileUpdate({ pfp: base64Img })
        }
        Alert.alert('Looking Good!', 'Your profile picture was automatically saved and updated.')
      }
    } catch (error) {
      Alert.alert('Error', error.message)
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
          {pfp ? (
            <Image source={{ uri: pfp }} style={{ width: '100%', height: '100%', borderRadius: 45 }} />
          ) : (
             <Text style={styles.avatarText}>{profile?.name ? profile.name[0].toUpperCase() : '?'}</Text>
          )}
        </View>
        <Pressable style={styles.editAvatarBtn} onPress={pickImage} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="camera-outline" size={16} color="#fff" />}
        </Pressable>
      </View>
      <Text style={[styles.profileName, { color: colors.text }]}>{profile?.name || 'User'}</Text>
      <View style={[styles.roleBadge, { backgroundColor: colors.roleBg }]}> 
        <Text style={[styles.roleText, { color: colors.roleText }]}>{profile?.role || 'Worker'}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.listContent}>
        {renderHeader()}
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>
          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Email Address</Text>
              <View style={[styles.disabledInput, { backgroundColor: colors.inputBg }]}> 
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.muted} />
                <Text style={[styles.disabledInputText, { color: colors.muted }]}>{user.email}</Text>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Full Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}> 
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.roleText} />
                <TextInput 
                  style={[styles.input, { color: colors.text }]} 
                  value={name} 
                  onChangeText={setName} 
                  placeholder="Enter your name"
                  placeholderTextColor={colors.secondary}
                  blurOnSubmit={false}
                  returnKeyType="done"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Dark Mode</Text>
              <Pressable
                style={[styles.themeToggle, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                onPress={toggleDarkMode}
              >
                <Text style={[styles.themeToggleText, { color: colors.text }]}>{darkMode ? 'Enabled' : 'Disabled'}</Text>
                <View style={[styles.themeSwitch, { backgroundColor: darkMode ? '#4CD964' : '#545454' }]}> 
                  <View style={[styles.themeSwitchThumb, darkMode ? styles.themeSwitchRight : styles.themeSwitchLeft]} />
                </View>
              </Pressable>
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

        {profile?.role !== 'admin' && (
          <Pressable 
            style={[styles.historyButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={() => setHistoryModalVisible(true)}
          >
            <MaterialCommunityIcons name="history" size={24} color="#007AFF" />
            <View style={styles.historyBtnInfo}>
              <Text style={[styles.historyBtnText, { color: colors.text }]}>View Session History</Text>
              <Text style={[styles.logCount, { color: colors.secondary }]}>{logs.length} Total Sessions</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.secondary} />
          </Pressable>
        )}

        <Pressable style={[styles.logoutButton, { backgroundColor: colors.logoutBg, borderColor: colors.logoutBorder }]} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={isHistoryModalVisible} animationType="slide">
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setHistoryModalVisible(false)} style={styles.closeBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Session History</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <FlatList
            data={logs}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={[styles.logItem, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <View style={[styles.logIcon, { backgroundColor: isDark ? '#163222' : '#F0FFF4' }]}> 
                  <MaterialCommunityIcons name="clock-check-outline" size={20} color="#4CD964" />
                </View>
                <View style={styles.logInfo}>
                  <Text style={[styles.logDate, { color: colors.text }]}> 
                    {new Date(item.timeIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={[styles.logTime, { color: colors.secondary }]}> 
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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.secondary }]}>No sessions found.</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
  },
  themeToggleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  themeSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 3,
    justifyContent: 'center',
  },
  themeSwitchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  themeSwitchRight: {
    alignSelf: 'flex-end',
  },
  themeSwitchLeft: {
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: -8,
    marginBottom: 8,
  },
  historyBtnInfo: {
    flex: 1,
    marginLeft: 16,
  },
  historyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 8,
  },
})
