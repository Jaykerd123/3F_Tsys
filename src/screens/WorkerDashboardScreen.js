import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, FlatList, TextInput, Alert, ActivityIndicator, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { subscribeUserLogs, createTimeLog, updateTimeLog, sendSystemMessage, deleteTimeLog } from '../../services/firebase'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import DateTimePickerModal from "react-native-modal-datetime-picker"

export default function WorkerDashboardScreen({ user, profile, theme = 'light' }) {
  const [logs, setLogs] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editTimeIn, setEditTimeIn] = useState('')
  const [editTimeOut, setEditTimeOut] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
  const [pickerMode, setPickerMode] = useState('in') // 'in' or 'out'
  const isDark = theme === 'dark'
  const colors = {
    background: isDark ? '#121212' : '#f8f9fa',
    card: isDark ? '#1f1f1f' : '#fff',
    section: isDark ? '#181818' : '#fff',
    border: isDark ? '#2a2a2a' : '#eee',
    text: isDark ? '#fff' : '#1a1a1a',
    secondary: isDark ? '#ccc' : '#666',
    placeholder: isDark ? '#999' : '#999',
    input: isDark ? '#171717' : '#fff',
    actionBg: isDark ? '#0d3d7a' : '#007AFF',
    disabledBg: isDark ? '#2a2a2a' : '#f1f3f5',
  }

  useEffect(() => {
    const unsubscribe = subscribeUserLogs(user.uid, setLogs)
    return unsubscribe
  }, [user.uid])

  const activeLog = logs.find(log => !log.timeOut)

  const handleTimeIn = async () => {
    try {
      setLoading(true)
      await createTimeLog(user.uid, profile.name || user.email)
      await sendSystemMessage(profile.name || user.email, `${profile.name || user.email} timed in.`)
    } catch (error) {
      Alert.alert('Time In failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeOut = async () => {
    if (!activeLog) return
    try {
      setLoading(true)
      await updateTimeLog(activeLog.id, new Date().toISOString())
      await sendSystemMessage(profile.name || user.email, `${profile.name || user.email} timed out.`)
    } catch (error) {
      Alert.alert('Time Out failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = log => {
    setEditingId(log.id)
    setEditTimeIn(log.timeIn)
    setEditTimeOut(log.timeOut || '')
  }

  const showDatePicker = (mode) => {
    setPickerMode(mode)
    setDatePickerVisibility(true)
  }

  const handleConfirm = (date) => {
    if (pickerMode === 'in') {
      setEditTimeIn(date.toISOString())
    } else {
      setEditTimeOut(date.toISOString())
    }
    setDatePickerVisibility(false)
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
    Alert.alert('Delete Log', 'Are you sure you want to delete this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteTimeLog(id)
        } catch (error) {
          Alert.alert('Delete failed', error.message)
        }
      }}
    ])
  }

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}> 
      <View style={styles.headerLeft}>
        <Text style={[styles.companyTitle, { color: colors.secondary }]}>3F TIME TRACKER</Text>
        <Text style={[styles.greeting, { color: colors.secondary }]}>Welcome back,</Text>
        <Text style={[styles.userName, { color: colors.text }]}>{profile.name || 'Worker'}</Text>
        <Text style={[styles.roleLabel, { color: colors.secondary }]}>{profile.role ? `${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}` : 'Worker'}</Text>
      </View>
      <View style={styles.headerRight}>
        <View style={[styles.dashboardAvatar, { backgroundColor: isDark ? '#16212d' : '#F0F7FF' }]}>
          {profile.pfp ? (
            <Image source={{ uri: profile.pfp }} style={{ width: '100%', height: '100%', borderRadius: 999 }} />
          ) : (
            <Text style={[styles.dashboardAvatarText, { color: '#007AFF' }]}>{(profile.name || 'W')[0].toUpperCase()}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={[styles.statusDot, { backgroundColor: activeLog ? '#4CD964' : '#FF3B30' }]} />
          <Text style={[styles.statusText, { color: colors.secondary }]}>{activeLog ? 'On Clock' : 'Off Clock'}</Text>
        </View>
      </View>
    </View>
  )

  const renderActiveSession = () => (
    <View style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <Text style={[styles.cardTitle, { color: colors.text }]}>{activeLog ? 'Active Session' : 'Start Working'}</Text>
      {activeLog && (
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#007AFF" />
          <Text style={styles.timerText}>{getDurationText(activeLog.timeIn, null)}</Text>
        </View>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          activeLog ? styles.timeOutButton : styles.timeInButton,
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled
        ]}
        onPress={activeLog ? handleTimeOut : handleTimeIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialCommunityIcons 
              name={activeLog ? "logout" : "login"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.actionButtonText}>
              {activeLog ? 'Time Out' : 'Time In'}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        ListHeaderComponent={() => (
          <>
            {renderHeader()}
            {renderActiveSession()}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent History</Text>
          </>
        )}
        renderItem={({ item }) => (
          <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.logHeader}>
              <View style={styles.logDateContainer}>
                <MaterialCommunityIcons name="calendar-range" size={20} color="#666" />
                <Text style={[styles.logDate, { color: colors.text }]}>
                  {new Date(item.timeIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.logDurationBadge}>
                <Text style={styles.logDurationText}>{getDurationText(item.timeIn, item.timeOut)}</Text>
              </View>
            </View>

            <View style={[styles.logTimes, { backgroundColor: colors.section, borderColor: colors.border }]}> 
              <View style={styles.timeInfo}>
                <Text style={[styles.timeLabel, { color: colors.secondary }]}>Started</Text>
                <Text style={[styles.timeValue, { color: colors.text }]}> 
                  {new Date(item.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeInfo}>
                <Text style={[styles.timeLabel, { color: colors.secondary }]}>Ended</Text>
                <Text style={[styles.timeValue, { color: colors.text }]}> 
                  {item.timeOut 
                    ? new Date(item.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Active'}
                </Text>
              </View>
            </View>

            {editingId === item.id ? (
              <View style={[styles.editSection, { backgroundColor: colors.section, borderColor: colors.border }]}> 
                <Pressable 
                  style={[styles.dateTimeSelector, { backgroundColor: colors.input, borderColor: colors.border }]} 
                  onPress={() => showDatePicker('in')}
                >
                  <MaterialCommunityIcons name="clock-in" size={20} color={colors.secondary} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    In: {new Date(editTimeIn).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </Text>
                  <MaterialCommunityIcons name="pencil" size={16} color={colors.secondary} />
                </Pressable>

                <Pressable 
                  style={[styles.dateTimeSelector, { backgroundColor: colors.input, borderColor: colors.border }]} 
                  onPress={() => showDatePicker('out')}
                >
                  <MaterialCommunityIcons name="clock-out" size={20} color={colors.secondary} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    Out: {editTimeOut ? new Date(editTimeOut).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '---'}
                  </Text>
                  <MaterialCommunityIcons name="pencil" size={16} color={colors.secondary} />
                </Pressable>

                <View style={styles.editActions}>
                  <Pressable style={[styles.editBtn, styles.saveBtn]} onPress={saveEdit}>
                    <Text style={styles.editBtnText}>Save</Text>
                  </Pressable>
                  <Pressable style={[styles.editBtn, styles.cancelBtn]} onPress={() => setEditingId(null)}>
                    <Text style={styles.editBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.logActions}>
                <Pressable style={styles.iconAction} onPress={() => startEdit(item)}>
                  <MaterialCommunityIcons name="pencil-outline" size={22} color="#007AFF" />
                </Pressable>
                <Pressable style={styles.iconAction} onPress={() => removeLog(item.id)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF3B30" />
                </Pressable>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={60} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>No sessions recorded yet.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        date={pickerMode === 'in' ? (editTimeIn ? new Date(editTimeIn) : new Date()) : (editTimeOut ? new Date(editTimeOut) : new Date())}
        onConfirm={handleConfirm}
        onCancel={() => setDatePickerVisibility(false)}
        isDarkModeEnabled={isDark}
      />
    </SafeAreaView>
  )
}

function getDurationText(start, end) {
  if (!start) return '0h 0m'
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
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  dashboardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dashboardAvatarText: {
    fontSize: 22,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  headerLeft: {
    flex: 1,
  },
  companyTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#007AFF',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInButton: {
    backgroundColor: '#007AFF',
  },
  timeOutButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 6,
  },
  logDurationBadge: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logDurationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  logTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  timeInfo: {
    flex: 1,
    alignItems: 'center',
  },
  timeDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
  },
  timeLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  logActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  iconAction: {
    padding: 8,
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  editSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  dateTimeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editBtn: {
    flex: 0.48,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
  },
  cancelBtn: {
    backgroundColor: '#666',
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
})
