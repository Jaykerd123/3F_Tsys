import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, SectionList, ActivityIndicator, Pressable, Modal, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { subscribeAllLogs, subscribeUsers } from '../../services/firebase'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function AdminDashboardScreen({ theme = 'light', profile }) {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLogsModalVisible, setLogsModalVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 10
  const isDark = theme === 'dark'
  const colors = {
    background: isDark ? '#121212' : '#f8f9fa',
    card: isDark ? '#1f1f1f' : '#fff',
    border: isDark ? '#2a2a2a' : '#eee',
    text: isDark ? '#fff' : '#1a1a1a',
    secondary: isDark ? '#ccc' : '#666',
    badgeBg: isDark ? '#0f3c74' : '#007AFF',
    avatarBg: isDark ? '#16212d' : '#F0F7FF',
    badgeText: '#fff',
    section: isDark ? '#1a1a1f' : '#f1f3f5',
    empty: isDark ? '#888' : '#ccc',
    divider: isDark ? '#2a2a2a' : '#eee',
  }

  useEffect(() => {
    const unsubscribe = subscribeAllLogs(data => {
      setLogs(data)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeUsers(allUsers => {
      setUsers(allUsers)
    })
    return unsubscribe
  }, [])

  const userMap = users.reduce((map, user) => {
    map[user.id] = user
    return map
  }, {})

  const activeLogsMap = useMemo(() => {
    const map = {}
    logs.forEach(log => {
      if (!log.timeOut && !map[log.userId]) {
        map[log.userId] = log
      }
    })
    return map
  }, [logs])

  const userStatusSections = useMemo(() => {
    const workers = users.filter(u => u.role !== 'admin')
    const working = workers.filter(u => activeLogsMap[u.id])
    const offline = workers.filter(u => !activeLogsMap[u.id])
    const sections = []
    if (working.length > 0) sections.push({ title: 'Currently Working', data: working, active: true })
    if (offline.length > 0) sections.push({ title: 'Offline / Not Working', data: offline, active: false })
    return sections
  }, [users, activeLogsMap])

  const activeWorkersCount = Object.keys(activeLogsMap).length

  const totalPages = Math.ceil(logs.length / logsPerPage)
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * logsPerPage
    return logs.slice(start, start + logsPerPage)
  }, [logs, currentPage])

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    for(let i=1; i<=totalPages; i++) pages.push(i)

    return (
      <View style={[styles.paginationContainer, { backgroundColor: colors.header, borderTopColor: colors.border }]}>
        <Pressable 
          style={[styles.pageBtn, currentPage === 1 && { opacity: 0.5 }]} 
          onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={pages}
          keyExtractor={item => item.toString()}
          contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 10 }}
          renderItem={({ item: page }) => (
            <Pressable 
              key={page} 
              style={[styles.pageNumberBtn, currentPage === page && { backgroundColor: '#007AFF', borderColor: '#007AFF' }]}
              onPress={() => setCurrentPage(page)}
            >
              <Text style={[styles.pageNumberText, { color: currentPage === page ? '#fff' : colors.text }]}>{page}</Text>
            </Pressable>
          )}
        />

        <Pressable 
          style={[styles.pageBtn, currentPage === totalPages && { opacity: 0.5 }]} 
          onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
        </Pressable>
      </View>
    )
  }

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.divider }]}> 
      <View style={styles.headerLeft}>
        <Text style={[styles.companyTitle, { color: colors.badgeBg }]}>3F TIME TRACKER</Text>
        <Text style={[styles.userTitle, { color: colors.text }]}>{profile?.name ? `${profile.name}` : 'Admin'}</Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>System Overview</Text>
      </View>
      <View style={[styles.statsCard, { backgroundColor: colors.badgeBg }]}> 
        <Text style={styles.statsCount}>{activeWorkersCount}</Text>
        <Text style={styles.statsLabel}>Active Now</Text>
      </View>
    </View>
  )

  const renderLogsHeader = () => (
    <View style={styles.logsModalHeader}>
      <Pressable onPress={() => setLogsModalVisible(false)} style={styles.closeBtn}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
      </Pressable>
      <Text style={[styles.logsModalTitle, { color: colors.text }]}>All Time Logs</Text>
      <View style={{ width: 24 }} />
    </View>
  )

  const renderUserItem = ({ item, section }) => {
    const log = activeLogsMap[item.id]
    return (
      <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: section.active ? '#10b981' : colors.border }]}> 
        <View style={styles.userContainer}>
          <View style={[styles.avatar, { backgroundColor: section.active ? (isDark ? '#0f3a2c' : '#d1fae5') : colors.avatarBg }]}>
            {item.pfp ? (
              <Image source={{ uri: item.pfp }} style={{ width: '100%', height: '100%', borderRadius: 999 }} />
            ) : (
              <Text style={[styles.avatarText, { color: section.active ? '#10b981' : colors.badgeBg }]}>{(item.name || '?')[0]?.toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
            {section.active ? (
               <Text style={[styles.userRole, { color: '#10b981', fontWeight: '700' }]}>
                 Started at {new Date(log.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </Text>
            ) : (
               <Text style={[styles.userRole, { color: colors.secondary }]}>Inactive</Text>
            )}
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      {renderHeader()}
      
      <View style={styles.viewLogsContainer}>
        <Pressable style={[styles.viewLogsBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setLogsModalVisible(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="history" size={22} color={colors.badgeBg} />
            <Text style={[styles.viewLogsText, { color: colors.text }]}>View All User Time Logs</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.secondary} />
        </Pressable>
      </View>

      <SectionList
        sections={userStatusSections}
        keyExtractor={item => item.id}
        extraData={activeLogsMap}
        renderItem={renderUserItem}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeaderTitle, { color: section.active ? '#10b981' : colors.secondary }]}>{section.title}</Text>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />

      <Modal visible={isLogsModalVisible} animationType="slide">
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          {renderLogsHeader()}
          <View style={{ flex: 1 }}>
            <FlatList
              data={paginatedLogs}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <View style={styles.logHeader}>
                  <View style={styles.userContainer}>
                    <View style={styles.avatar}>
                      {userMap[item.userId]?.pfp ? (
                         <Image source={{ uri: userMap[item.userId]?.pfp }} style={{ width: '100%', height: '100%', borderRadius: 999 }} />
                      ) : (
                         <Text style={styles.avatarText}>{(userMap[item.userId]?.name || item.userName || '?')[0]?.toUpperCase() || '?'}</Text>
                      )}
                    </View>
                    <View>
                      <Text style={[styles.userName, { color: colors.text }]}>{userMap[item.userId]?.name || item.userName || 'Unknown'}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: colors.section, borderColor: colors.border }]}> 
                        <View style={[styles.statusDot, { backgroundColor: item.timeOut ? '#8E8E93' : '#4CD964' }]} />
                        <Text style={[styles.statusText, { color: colors.secondary }]}>{item.timeOut ? 'Completed' : 'Working Now'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{getDurationText(item.timeIn, item.timeOut)}</Text>
                  </View>
                </View>

                <View style={[styles.timeDetails, { backgroundColor: colors.section, borderColor: colors.border }]}> 
                  <View style={styles.timeBlock}>
                    <MaterialCommunityIcons name="clock-in" size={16} color={theme === 'dark' ? '#4dabf7' : '#007AFF'} />
                    <View style={styles.timeTextContent}>
                      <Text style={[styles.timeLabel, { color: colors.secondary }]}>Started</Text>
                      <Text style={[styles.timeValue, { color: colors.text }]}> 
                        {new Date(item.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timeDivider} />
                  <View style={styles.timeBlock}>
                    <MaterialCommunityIcons name="clock-out" size={16} color="#FF3B30" />
                    <View style={styles.timeTextContent}>
                      <Text style={[styles.timeLabel, { color: colors.secondary }]}>Ended</Text>
                      <Text style={[styles.timeValue, { color: colors.text }]}> 
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
              loading ? <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} /> : 
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="history" size={60} color={colors.empty} />
                <Text style={[styles.emptyText, { color: colors.secondary }]}>No logs found.</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
          {renderPagination()}
          </View>
        </SafeAreaView>
      </Modal>
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
    marginBottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  viewLogsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  viewLogsBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 0,
  },
  viewLogsText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  userCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  logsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logsModalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 8,
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
  userTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
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
  userRole: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 2,
    textTransform: 'capitalize',
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
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  pageBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(150,150,150,0.1)',
  },
  pageNumberBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  pageNumberText: {
    fontSize: 15,
    fontWeight: '700',
  },
})
