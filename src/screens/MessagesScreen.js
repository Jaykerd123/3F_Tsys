import React, { useEffect, useState, useRef } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { subscribeMessages, sendMessage } from '../../services/firebase'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function MessagesScreen({ user, profile }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const flatListRef = useRef(null)

  useEffect(() => {
    const unsubscribe = subscribeMessages(setMessages)
    return unsubscribe
  }, [])

  const handleSend = async () => {
    if (!draft.trim()) return
    try {
      await sendMessage(user.uid, profile.name || user.email, draft.trim())
      setDraft('')
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100)
    } catch (error) {
      Alert.alert('Send failed', error.message)
    }
  }

  const renderMessage = ({ item }) => {
    const isMe = item.userId === user.uid
    const isSystem = item.system

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessageLine} />
          <Text style={styles.systemMessageText}>{item.text}</Text>
          <View style={styles.systemMessageLine} />
        </View>
      )
    }

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.userName ? item.userName[0].toUpperCase() : '?'}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {!isMe && <Text style={styles.userName}>{item.userName}</Text>}
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
            {new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Group Chat</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Team</Text>
        </View>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={draft}
              onChangeText={setDraft}
              multiline
              placeholderTextColor="#999"
            />
            <Pressable 
              style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]} 
              onPress={handleSend}
              disabled={!draft.trim()}
            >
              <MaterialCommunityIcons name="send" size={24} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  badge: {
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f3f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  myBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#f1f3f5',
    borderBottomLeftRadius: 4,
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirTimestamp: {
    color: '#999',
  },
  systemMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  systemMessageLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  systemMessageText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginHorizontal: 12,
  },
  inputContainer: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
    color: '#1a1a1a',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
})
