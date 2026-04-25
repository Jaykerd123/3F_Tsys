import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchUsers } from '../../services/firebase'
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
    let active = true
    const loadMembers = async () => {
      try {
        const users = await fetchUsers()
        if (active) {
          setMembers(users)
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load members.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadMembers()
    return () => {
      active = false
    }
  }, [])

  const renderMember = ({ item }) => (
    <View style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <View style={[styles.avatar, { backgroundColor: isDark ? '#23304a' : '#E8F2FF' }]}> 
        <Text style={[styles.avatarText, { color: isDark ? '#fff' : '#007AFF' }]}>{item.name ? item.name[0].toUpperCase() : '?'}</Text>
      </View>
      <View>
        <Text style={[styles.memberName, { color: colors.text }]}>{item.name || item.email}</Text>
        <Text style={[styles.memberRole, { color: colors.secondary }]}>{item.role ? `${item.role.charAt(0).toUpperCase() + item.role.slice(1)}` : 'Worker'}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}> 
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.accent} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Members</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loading} />
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        ) : (
          <FlatList
            data={members}
            keyExtractor={item => item.id}
            renderItem={renderMember}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.secondary }]}>No members found.</Text>}
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
  },
  body: {
    flex: 1,
    padding: 16,
  },
  loading: {
    marginTop: 40,
  },
  listContent: {
    paddingBottom: 24,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberRole: {
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
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
