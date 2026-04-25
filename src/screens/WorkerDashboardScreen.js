import React, { useEffect, useState } from 'react'
import { View, Text, Button, StyleSheet, FlatList, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { subscribeUserLogs, createTimeLog, updateTimeLog, sendSystemMessage, deleteTimeLog } from '../../services/firebase'

export default function WorkerDashboardScreen({ user, profile }) {
  const [logs, setLogs] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editTimeIn, setEditTimeIn] = useState('')
  const [editTimeOut, setEditTimeOut] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeUserLogs(user.uid, setLogs)
    return unsubscribe
  }, [user.uid])

  const activeLog = logs.find(log => !log.timeOut)

  const handleTimeIn = async () => {
    try {
      await createTimeLog(user.uid, profile.name || user.email)
      await sendSystemMessage(profile.name || user.email, `${profile.name || user.email} timed in.`)
    } catch (error) {
      Alert.alert('Time In failed', error.message)
    }
  }

  const handleTimeOut = async () => {
    if (!activeLog) return
    try {
      await updateTimeLog(activeLog.id, new Date().toISOString())
      await sendSystemMessage(profile.name || user.email, `${profile.name || user.email} timed out.`)
    } catch (error) {
      Alert.alert('Time Out failed', error.message)
    }
  }

  const startEdit = log => {
    setEditingId(log.id)
    setEditTimeIn(log.timeIn)
    setEditTimeOut(log.timeOut || '')
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await updateTimeLog(editingId, editTimeOut || null, editTimeIn)
      setEditingId(null)
    } catch (error) {
      Alert.alert('Update failed', error.message)
    }
  }

  const removeLog = async id => {
    try {
      await deleteTimeLog(id)
    } catch (error) {
      Alert.alert('Delete failed', error.message)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Worker Dashboard</Text>
      <View style={styles.buttonRow}>
        {!activeLog ? (
          <Button title="Time In" onPress={handleTimeIn} />
        ) : (
          <Button title="Time Out" onPress={handleTimeOut} color="#cc0000" />
        )}
      </View>
      <Text style={styles.sectionTitle}>Recent Sessions</Text>
      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <Text style={styles.logLabel}>Start</Text>
            <Text>{new Date(item.timeIn).toLocaleString()}</Text>
            <Text style={styles.logLabel}>End</Text>
            <Text>{item.timeOut ? new Date(item.timeOut).toLocaleString() : 'Active session'}</Text>
            <Text style={styles.logLabel}>Duration</Text>
            <Text>{getDurationText(item.timeIn, item.timeOut)}</Text>
            {editingId === item.id ? (
              <>
                <TextInput
                  style={styles.input}
                  value={editTimeIn}
                  onChangeText={setEditTimeIn}
                  placeholder="YYYY-MM-DDTHH:MM:SS"
                />
                <TextInput
                  style={styles.input}
                  value={editTimeOut}
                  onChangeText={setEditTimeOut}
                  placeholder="YYYY-MM-DDTHH:MM:SS"
                />
                <Button title="Save" onPress={saveEdit} />
              </>
            ) : (
              <View style={styles.logActions}>
                <Button title="Edit" onPress={() => startEdit(item)} />
                <Button title="Delete" onPress={() => removeLog(item.id)} color="#cc0000" />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No time logs yet.</Text>}
      />
    </SafeAreaView>
  )
}

function getDurationText(start, end) {
  if (!start) return 'Unknown'
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : new Date()
  const diff = Math.max(0, endDate - startDate)
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  return `${hours}h ${minutes}m`
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
  buttonRow: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
  },
  logCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logLabel: {
    marginTop: 8,
    fontWeight: '600',
  },
  logActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
    color: '#666',
  },
})
