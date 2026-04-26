import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, SectionList, StyleSheet, ActivityIndicator, Pressable, Platform, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { subscribeUsers } from '../../services/firebase'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function MembersScreen({ theme = 'light', navigation }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isDark = theme === 'dark'

  const colors = {
    background: isDark ? '#121212' : '#f8f9fa',
    card: isDark ? '#1f1f1f' : '#fff',
    border: isDark ? '#2a2a2a' : '#e6eaef',
    text: isDark ? '#fff' : '#1a1a1a',
    secondary: isDark ? '#ccc' : '#6f7d94',
    accent: isDark ? '#4dabf7' : '#007AFF',
  }

  useEffect(() => {
    const unsubscribe = subscribeUsers(
      (users) => {
        setMembers(users)
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Unable to load members.')
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const groupedMembers = useMemo(() => {
    if (!members.length) return []
    const admins = members.filter(m => m.role === 'admin')
    const workers = members.filter(m => m.role !== 'admin')
    const sections = []
    if (admins.length > 0) sections.push({ title: 'Administrators', data: admins, icon: 'shield-crown', color: '#8b5cf6' })
    if (workers.length > 0) sections.push({ title: 'Workers', data: workers, icon: 'account-group', color: '#10b981' })
    return sections
  }, [members])

  const renderMember = ({ item }) => {
    const isAdmin = item.role === 'admin'
    return (
      <View style={[styles.memberRow, { backgroundColor: colors.card, borderColor: isDark ? colors.border : 'transparent' }]}> 
        <View style={[styles.avatar, { backgroundColor: isAdmin ? (isDark ? '#3c2865' : '#ede9fe') : (isDark ? '#0f3a2c' : '#d1fae5') }]}> 
          {item.pfp ? (
            <Image source={{ uri: item.pfp }} style={{ width: '100%', height: '100%', borderRadius: 999 }} />
          ) : (
            <Text style={[styles.avatarText, { color: isAdmin ? '#8b5cf6' : '#10b981' }]}>{item.name ? item.name[0].toUpperCase() : '?'}</Text>
          )}
        </View>
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: colors.text }]}>{item.name || item.email}</Text>
          <Text style={[styles.memberRole, { color: colors.secondary }]}>{isAdmin ? 'Administrator' : 'Worker'}</Text>
        </View>
        {isAdmin && <MaterialCommunityIcons name="shield-check" size={20} color="#8b5cf6" style={styles.roleIcon} />}
      </View>
    )
  }

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={section.icon} size={20} color={section.color} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      <View style={[styles.countBadge, { backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9' }]}>
        <Text style={[styles.countText, { color: colors.secondary }]}>{section.data.length}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: isDark ? colors.border : 'transparent', backgroundColor: colors.card, shadowColor: '#000', elevation: isDark ? 0 : 5 }]}> 
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Team Members</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loading} />
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        ) : (
          <SectionList
            sections={groupedMembers}
            keyExtractor={item => item.id}
            renderItem={renderMember}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.secondary }]}>No team members found.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  body: {
    flex: 1,
  },
  loading: {
    marginTop: 40,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 8,
  },
  countBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 13,
    fontWeight: '500',
  },
  roleIcon: {
    opacity: 0.8,
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 15,
  },
  errorText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 15,
  },
})
