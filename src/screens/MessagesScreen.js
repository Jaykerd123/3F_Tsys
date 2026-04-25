import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { subscribeMessages, sendMessage } from '../../services/firebase'

export default function MessagesScreen({ user, profile }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeMessages(setMessages)
    return unsubscribe
  }, [])

  const handleSend = async () => {
    if (!draft.trim()) return
    try {
      await sendMessage(user.uid, profile.name || user.email, draft.trim())
      setDraft('')
    } catch (error) {
      Alert.alert('Send failed', error.message)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Group Chat</Text>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageBlock, item.system && styles.systemMessage]}>
            <Text style={styles.messageUser}>{item.system ? 'System' : item.userName}</Text>
            <Text>{item.text}</Text>
            <Text style={styles.timestamp}>{new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : new Date()).toLocaleString()}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={draft}
          onChangeText={setDraft}
        />
        <Button title="Send" onPress={handleSend} />
      </View>
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
  messageBlock: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f3f3f3',
  },
  systemMessage: {
    backgroundColor: '#e8f7ff',
  },
  messageUser: {
    fontWeight: '700',
    marginBottom: 4,
  },
  timestamp: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
})
