import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert, ScrollView, ActivityIndicator, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchUsers, fetchTimeLogsByRange } from '../../services/firebase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import DateTimePickerModal from "react-native-modal-datetime-picker"

export default function CalculationScreen({ theme = 'light' }) {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [hourlyRate, setHourlyRate] = useState('20')
  const [results, setResults] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const isDark = theme === 'dark'
  const colors = {
    background: isDark ? '#121212' : '#f8f9fa',
    header: isDark ? '#1e1e1e' : '#fff',
    text: isDark ? '#fff' : '#1a1a1a',
    secondary: isDark ? '#ccc' : '#666',
    card: isDark ? '#1f1f1f' : '#fff',
    border: isDark ? '#2a2a2a' : '#eee',
    avatarBg: isDark ? '#232323' : '#F0F7FF',
    rateInput: isDark ? '#1e1e1e' : '#fff',
    modal: isDark ? '#181818' : '#fff',
    modalOverlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
    placeholder: isDark ? '#999' : '#999',
  }
  
  // Date Picker States
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [isStartPickerVisible, setStartPickerVisibility] = useState(false)
  const [isEndPickerVisible, setEndPickerVisibility] = useState(false)
  const [isModalVisible, setModalVisible] = useState(false)

  const loadUsers = async () => {
    try {
      console.log("[Payroll] Fetching users list...");
      const allUsers = await fetchUsers()
      const workers = allUsers.filter(u => u.role !== 'admin')
      setUsers(workers)
      await AsyncStorage.setItem('cached_workers', JSON.stringify(workers))
    } catch (error) {
      const cached = await AsyncStorage.getItem('cached_workers')
      if (cached) setUsers(JSON.parse(cached))
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setResults(null)
    setModalVisible(true)
  }

  const handleConfirmStart = (date) => {
    setStartDate(date)
    setStartPickerVisibility(false)
  }

  const handleConfirmEnd = (date) => {
    setEndDate(date)
    setEndPickerVisibility(false)
  }

  const calculate = async () => {
    if (!selectedUser) return
    
    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]

    try {
      setCalculating(true)
      const logs = await fetchTimeLogsByRange(startStr, endStr)
      const filtered = logs.filter(log => log.userId === selectedUser.id && log.timeOut)
      
      let totalHours = 0
      filtered.forEach(log => {
        const duration = (new Date(log.timeOut) - new Date(log.timeIn)) / 3600000
        totalHours += Math.max(0, duration)
      })

      setResults({
        userName: selectedUser.name,
        hours: Number(totalHours.toFixed(2)),
        salary: Number((totalHours * Number(hourlyRate || '0')).toFixed(2)),
      })
    } catch (error) {
      Alert.alert('Calculation failed', error.message)
    } finally {
      setCalculating(false)
    }
  }

  const renderWorkerItem = ({ item }) => (
    <Pressable style={[styles.workerCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleSelectUser(item)}>
      <View style={[styles.workerAvatar, { backgroundColor: colors.avatarBg }]}> 
        <Text style={[styles.avatarText, { color: colors.text }]}>{item.name ? item.name[0].toUpperCase() : '?'}</Text>
      </View>
      <View style={styles.workerInfo}>
        <Text style={[styles.workerName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.workerEmail, { color: colors.secondary }]}>{item.email}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.secondary} />
    </Pressable>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}> 
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Payroll</Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>Select a worker to compute</Text>
        </View>
        <Pressable style={styles.refreshBtn} onPress={loadUsers}>
          <MaterialCommunityIcons name="refresh" size={24} color="#007AFF" />
        </Pressable>
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={renderWorkerItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-group-outline" size={60} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>No workers found.</Text>
          </View>
        }
      />

      {/* Calculation Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}> 
          <View style={[styles.modalContent, { backgroundColor: colors.modal }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Compute Payroll</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.secondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.selectedWorkerHeader, { backgroundColor: colors.card }]}> 
                <View style={[styles.smallAvatar, { backgroundColor: colors.avatarBg }]}> 
                  <Text style={[styles.smallAvatarText, { color: colors.text }]}>{selectedUser?.name?.[0].toUpperCase()}</Text>
                </View>
                <Text style={[styles.selectedWorkerName, { color: colors.text }]}>{selectedUser?.name}</Text>
              </View>

              <Text style={[styles.inputLabel, { color: colors.secondary }]}>Select Date Range</Text>
              <View style={styles.dateRow}>
                <Pressable style={[styles.dateInput, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setStartPickerVisibility(true)}>
                  <MaterialCommunityIcons name="calendar-import" size={20} color="#007AFF" />
                  <View style={styles.dateTextWrapper}>
                    <Text style={styles.dateLabel}>From</Text>
                    <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
                  </View>
                </Pressable>

                <Pressable style={[styles.dateInput, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setEndPickerVisibility(true)}>
                  <MaterialCommunityIcons name="calendar-export" size={20} color="#FF3B30" />
                  <View style={styles.dateTextWrapper}>
                    <Text style={styles.dateLabel}>To</Text>
                    <Text style={styles.dateValue}>{endDate.toLocaleDateString()}</Text>
                  </View>
                </Pressable>
              </View>

              <Text style={[styles.inputLabel, { color: colors.secondary }]}>Hourly Rate (₱)</Text>
              <View style={styles.rateInputWrapper}>
                <Text style={[styles.rateSymbol, { color: colors.secondary }]}>₱</Text>
                <TextInput
                  style={[styles.rateInput, { backgroundColor: colors.rateInput, color: colors.text, borderColor: colors.border }]}
                  keyboardType="numeric"
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <Pressable 
                style={[styles.calcBtn, calculating && styles.btnDisabled]} 
                onPress={calculate}
                disabled={calculating}
              >
                {calculating ? <ActivityIndicator color="#fff" /> : <Text style={styles.calcBtnText}>Calculate</Text>}
              </Pressable>

              {results && (
                <View style={styles.resultCard}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Total Hours:</Text>
                    <Text style={styles.resultValue}>{results.hours}h</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Gross Salary:</Text>
                    <Text style={styles.salaryValue}>₱{results.salary}</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={isStartPickerVisible}
        mode="date"
        onConfirm={handleConfirmStart}
        onCancel={() => setStartPickerVisibility(false)}
        date={startDate}
      />

      <DateTimePickerModal
        isVisible={isEndPickerVisible}
        mode="date"
        onConfirm={handleConfirmEnd}
        onCancel={() => setEndPickerVisibility(false)}
        date={endDate}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  refreshBtn: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  workerEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  selectedWorkerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 16,
    marginBottom: 24,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  smallAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedWorkerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateInput: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dateTextWrapper: {
    marginLeft: 10,
  },
  dateLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  rateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 56,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  rateSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 8,
  },
  rateInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  calcBtn: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  calcBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  resultCard: {
    backgroundColor: '#F0F7FF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  resultDivider: {
    height: 1,
    backgroundColor: 'rgba(0,122,255,0.1)',
    marginVertical: 4,
  },
  salaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#007AFF',
  },
})
