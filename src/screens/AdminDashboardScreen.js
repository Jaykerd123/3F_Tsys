import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { subscribeAllLogs } from '../../services/firebase'

export default function AdminDashboardScreen() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const unsubscribe = subscribeAllLogs(setLogs)
    return unsubscribe
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>All employee sessions</Text>
      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <Text style={styles.logUser}>{item.userName}</Text>
            <Text style={styles.logLabel}>In:</Text>
            <Text>{new Date(item.timeIn).toLocaleString()}</Text>
            <Text style={styles.logLabel}>Out:</Text>
            <Text>{item.timeOut ? new Date(item.timeOut).toLocaleString() : 'Active'}</Text>
            <Text style={styles.logLabel}>Duration:</Text>
            <Text>{getDurationText(item.timeIn, item.timeOut)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No sessions found yet.</Text>}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#555',
  },
  logCard: {
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
  },
  logUser: {
    fontWeight: '700',
    marginBottom: 8,
  },
  logLabel: {
    marginTop: 8,
    fontWeight: '600',
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    color: '#777',
  },
})
