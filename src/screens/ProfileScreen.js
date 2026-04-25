import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, FlatList, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { logout, updateUserProfile, subscribeUserLogs, deleteTimeLog } from '../../services/firebase'

export default function ProfileScreen({ user, profile }) {
  const [name, setName] = useState(profile?.name || '')
  const [logs, setLogs] = useState([])

  useEffect(() => {
    setName(profile?.name || '')
  }, [profile?.name])

  useEffect(() => {
    const unsubscribe = subscribeUserLogs(user.uid, setLogs)
    return unsubscribe
  }, [user.uid])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      Alert.alert('Logout failed', error.message)
    }
  }

  const handleSave = async () => {
    try {
      await updateUserProfile(user.uid, { name })
      Alert.alert('Saved', 'Profile updated successfully.')
    } catch (error) {
      Alert.alert('Update failed', error.message)
    }
  }

  const handleDeleteLog = async id => {
    try {
      await deleteTimeLog(id)
    } catch (error) {
      Alert.alert('Delete failed', error.message)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.label}>Role: {profile?.role || 'Worker'}</Text>
      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>{user.email}</Text>
      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Button title="Save profile" onPress={handleSave} />
      <View style={styles.divider} />
      <Text style={styles.subtitle}>Your time logs</Text>
      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <Text>{new Date(item.timeIn).toLocaleString()}</Text>
            <Text>{item.timeOut ? new Date(item.timeOut).toLocaleString() : 'Active session'}</Text>
            <Button title="Delete log" color="#cc0000" onPress={() => handleDeleteLog(item.id)} />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No logs available.</Text>}
      />
      <View style={styles.logoutButton}>
        <Button title="Logout" color="#cc0000" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
    fontWeight: '600',
  },
  value: {
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  logCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  empty: {
    color: '#777',
  },
  logoutButton: {
    marginTop: 20,
  },
})
