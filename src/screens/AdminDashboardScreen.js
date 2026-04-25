import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { subscribeAllLogs } from '../../services/firebase'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function AdminDashboardScreen() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeAllLogs(data => {
      setLogs(data)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const activeWorkersCount = logs.filter(log => !log.timeOut).length

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>System Overview</Text>
      </View>
      <View style={styles.statsCard}>
        <Text style={styles.statsCount}>{activeWorkersCount}</Text>
        <Text style={styles.statsLabel}>Active Now</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={styles.userContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.userName ? item.userName[0].toUpperCase() : '?'}</Text>
                </View>
                <View>
                  <Text style={styles.userName}>{item.userName || 'Unknown'}</Text>
                  <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: item.timeOut ? '#8E8E93' : '#4CD964' }]} />
                    <Text style={styles.statusText}>{item.timeOut ? 'Completed' : 'Working Now'}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{getDurationText(item.timeIn, item.timeOut)}</Text>
              </View>
            </View>

            <View style={styles.timeDetails}>
              <View style={styles.timeBlock}>
                <MaterialCommunityIcons name="clock-in" size={16} color="#007AFF" />
                <View style={styles.timeTextContent}>
                  <Text style={styles.timeLabel}>Started</Text>
                  <Text style={styles.timeValue}>
                    {new Date(item.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeBlock}>
                <MaterialCommunityIcons name="clock-out" size={16} color="#FF3B30" />
                <View style={styles.timeTextContent}>
                  <Text style={styles.timeLabel}>Ended</Text>
                  <Text style={styles.timeValue}>
                    {item.timeOut 
                      ? new Date(item.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '---'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.dateFooter}>
              <MaterialCommunityIcons name="calendar-outline" size={14} color="#999" />
              <Text style={styles.dateText}>
                {new Date(item.timeIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="history" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No logs found.</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  statsCard: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  statsCount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  statsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  durationBadge: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
  },
  timeDetails: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  timeBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeTextContent: {
    marginLeft: 8,
  },
  timeLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  timeDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#eee',
    marginHorizontal: 12,
  },
  dateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
    fontWeight: '500',
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
})
