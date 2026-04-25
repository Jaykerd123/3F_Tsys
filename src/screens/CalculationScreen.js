
import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchUsers, fetchTimeLogsByRange } from '../../services/firebase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function CalculationScreen() {
  const [users, setUsers] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [hourlyRate, setHourlyRate] = useState('20')
  const [results, setResults] = useState([])
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        console.log("[Payroll] Fetching users list...");
        const allUsers = await fetchUsers()
        console.log(`[Payroll] Found ${allUsers.length} total users.`);
        const workers = allUsers.filter(u => u.role !== 'admin')
        console.log(`[Payroll] Filtered to ${workers.length} workers.`);
        setUsers(workers)
        await AsyncStorage.setItem('cached_workers', JSON.stringify(workers))
      } catch (error) {
        console.error("[Payroll] User fetch error:", error);
        const cached = await AsyncStorage.getItem('cached_workers')
        if (cached) {
          console.log("[Payroll] Using cached worker list.");
          setUsers(JSON.parse(cached))
        }
      }
    }
    loadUsers()
  }, [])

  const toggleUser = userId => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const calculate = async () => {
    if (!startDate || !endDate || selectedUserIds.length === 0) {
      Alert.alert('Missing Information', 'Please select employees and a date range.')
      return
    }
    try {
      setCalculating(true)
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
    } finally {
      setCalculating(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Payroll</Text>
          <Text style={styles.subtitle}>Salary Calculator</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Select Employees</Text>
          <View style={styles.userListContainer}>
            {users.length > 0 ? (
              users.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleUser(item.id)}
                  style={[
                    styles.userRow, 
                    selectedUserIds.includes(item.id) && styles.userSelected
                  ]}
                >
                  <View style={styles.userInfo}>
                    <View style={[styles.checkbox, selectedUserIds.includes(item.id) && styles.checkboxSelected]}>
                      {selectedUserIds.includes(item.id) && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                    </View>
                    <Text style={[styles.userName, selectedUserIds.includes(item.id) && styles.userNameSelected]}>
                      {item.name}
                    </Text>
                  </View>
                  {selectedUserIds.includes(item.id) && (
                    <MaterialCommunityIcons name="account-check" size={20} color="#007AFF" />
                  )}
                </Pressable>
              ))
            ) : (
              <View style={styles.noUsersContainer}>
                <MaterialCommunityIcons name="account-off-outline" size={32} color="#ccc" />
                <Text style={styles.noUsersText}>No workers found.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Date Range & Rate</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="calendar-start" size={20} color="#666" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Start (YYYY-MM-DD)" 
                value={startDate} 
                onChangeText={setStartDate} 
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="calendar-end" size={20} color="#666" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="End (YYYY-MM-DD)" 
                value={endDate} 
                onChangeText={setEndDate} 
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="currency-usd" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Hourly Rate"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.calculateButton,
            pressed && styles.buttonPressed,
            calculating && styles.buttonDisabled
          ]} 
          onPress={calculate}
          disabled={calculating}
        >
          {calculating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="calculator" size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.calculateButtonText}>Compute Payroll</Text>
            </>
          )}
        </Pressable>

        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Calculation Results</Text>
            {results.map(item => (
              <View key={item.userId} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultUserName}>{item.userName}</Text>
                  <View style={styles.salaryBadge}>
                    <Text style={styles.salaryText}>${item.salary}</Text>
                  </View>
                </View>
                <View style={styles.resultDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Hours</Text>
                    <Text style={styles.detailValue}>{item.hours}h</Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Rate/hr</Text>
                    <Text style={styles.detailValue}>${hourlyRate}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  userListContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 100,
    justifyContent: 'center',
  },
  noUsersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noUsersText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  userSelected: {
    backgroundColor: '#F0F7FF',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  userName: {
    fontSize: 16,
    color: '#444',
    fontWeight: '500',
  },
  userNameSelected: {
    color: '#007AFF',
    fontWeight: '700',
  },
  inputGroup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  calculateButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: '#a0c4ff',
  },
  resultsSection: {
    marginTop: 32,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultUserName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  salaryBadge: {
    backgroundColor: '#4CD964',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  salaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  resultDetails: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#eee',
  },
  detailLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
})
