import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, FlatList, Pressable, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchUsers, fetchTimeLogsByRange } from '../../services/firebase'

export default function CalculationScreen() {
  const [users, setUsers] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [hourlyRate, setHourlyRate] = useState('20')
  const [results, setResults] = useState([])

  useEffect(() => {
    fetchUsers().then(setUsers).catch(console.error)
  }, [])

  const toggleUser = userId => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const calculate = async () => {
    if (!startDate || !endDate || selectedUserIds.length === 0) {
      Alert.alert('Validation', 'Choose users and date range before calculating.')
      return
    }
    try {
      const logs = await fetchTimeLogsByRange(startDate, endDate)
      const filtered = logs.filter(log => selectedUserIds.includes(log.userId) && log.timeOut)
      const byUser = {}
      filtered.forEach(log => {
        const duration = (new Date(log.timeOut) - new Date(log.timeIn)) / 3600000
        if (!byUser[log.userId]) {
          byUser[log.userId] = { userName: log.userName, hours: 0 }
        }
        byUser[log.userId].hours += Math.max(0, duration)
      })
      setResults(Object.entries(byUser).map(([userId, data]) => ({
        userId,
        userName: data.userName,
        hours: Number(data.hours.toFixed(2)),
        salary: Number((data.hours * Number(hourlyRate || '0')).toFixed(2)),
      })))
    } catch (error) {
      Alert.alert('Calculation failed', error.message)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Payroll Calculation</Text>
      <Text style={styles.label}>Select employees</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggleUser(item.id)}
            style={[styles.userRow, selectedUserIds.includes(item.id) && styles.userSelected]}
          >
            <Text style={styles.userName}>{item.name}</Text>
            <Text>{selectedUserIds.includes(item.id) ? 'Selected' : 'Tap to select'}</Text>
          </Pressable>
        )}
        style={styles.userList}
      />
      <Text style={styles.label}>Date range (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} placeholder="Start date" value={startDate} onChangeText={setStartDate} />
      <TextInput style={styles.input} placeholder="End date" value={endDate} onChangeText={setEndDate} />
      <Text style={styles.label}>Hourly rate</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={hourlyRate}
        onChangeText={setHourlyRate}
      />
      <Button title="Compute salary" onPress={calculate} />
      {results.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.sectionTitle}>Results</Text>
          {results.map(item => (
            <View key={item.userId} style={styles.resultCard}>
              <Text style={styles.resultName}>{item.userName}</Text>
              <Text>Hours: {item.hours}</Text>
              <Text>Salary: ${item.salary}</Text>
            </View>
          ))}
        </View>
      )}
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
    marginBottom: 12,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  userList: {
    maxHeight: 180,
  },
  userRow: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 8,
  },
  userSelected: {
    backgroundColor: '#e6f0ff',
    borderColor: '#0066cc',
  },
  userName: {
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
  },
  results: {
    marginTop: 16,
  },
  resultCard: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
  },
  resultName: {
    fontWeight: '700',
    marginBottom: 4,
  },
})
