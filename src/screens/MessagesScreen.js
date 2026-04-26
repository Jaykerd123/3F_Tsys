import React, { useEffect, useState, useRef } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { subscribeMessages, sendMessage } from '../../services/firebase'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function MessagesScreen({ user, profile, theme = 'light', navigation }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)
  const flatListRef = useRef(null)
  const isDark = theme === 'dark'
  const colors = {
    background: isDark ? '#121212' : '#fff',
    header: isDark ? '#1e1e1e' : '#fff',
    border: isDark ? '#2a2a2a' : '#eee',
    text: isDark ? '#fff' : '#1a1a1a',
    secondary: isDark ? '#ccc' : '#666',
    card: isDark ? '#1f1f1f' : '#f1f3f5',
    bubbleMe: isDark ? '#2a4d79' : '#007AFF',
    bubbleThem: isDark ? '#1f1f1f' : '#f1f3f5',
    bubbleTextThem: isDark ? '#fff' : '#1a1a1a',
    inputBg: isDark ? '#1e1e1e' : '#fff',
    inputBorder: isDark ? '#2a2a2a' : '#eee',
    placeholder: isDark ? '#999' : '#999',
    footer: isDark ? '#1e1e1e' : '#fff',
  }

  useEffect(() => {
    const unsubscribe = subscribeMessages(setMessages)
    return unsubscribe
  }, [])

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
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
      const messageDate = new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : new Date())
      const dateString = messageDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
      return (
        <View style={[styles.systemMessageContainer, { opacity: isDark ? 0.7 : 1 }]}> 
          <View style={[styles.systemMessageLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.systemMessageText, { color: colors.secondary }]}>{item.text} • {dateString}</Text>
          <View style={[styles.systemMessageLine, { backgroundColor: colors.border }]} />
        </View>
      )
    }

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: isDark ? '#232323' : '#f1f3f5', borderColor: isDark ? '#2a2a2a' : '#eee' }]}> 
            <Text style={[styles.avatarText, { color: isDark ? '#ddd' : '#666' }]}>{item.userName ? item.userName[0].toUpperCase() : '?'}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble, { backgroundColor: isMe ? colors.bubbleMe : colors.bubbleThem }]}> 
          {!isMe && <Text style={[styles.userName, { color: isDark ? '#ccc' : '#666' }]}>{item.userName}</Text>}
          <Text style={[styles.messageText, isMe ? styles.myMessageText : { color: colors.bubbleTextThem }]}> 
            {item.text}
          </Text>
          <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp, !isMe && { color: isDark ? '#bbb' : '#999' }]}> 
            {new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}> 
        <Text style={[styles.title, { color: colors.text }]}>3F Chat</Text>
        <Pressable style={[styles.membersButton, { backgroundColor: isDark ? '#0f3a6f' : '#E8F2FF' }]} onPress={() => navigation.navigate('Members')}> 
          <MaterialCommunityIcons name="account-group" size={18} color={isDark ? '#D6E7FF' : '#007AFF'} />
          <Text style={[styles.membersButtonText, { color: isDark ? '#D6E7FF' : '#007AFF' }]}>Members</Text>
        </Pressable>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[styles.listContent, { paddingBottom: 90 }]}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={[styles.keyboardAvoid, Platform.OS === 'ios' ? { marginBottom: isKeyboardVisible ? 0 : 80 } : { marginBottom: 80 }]}
      >
        <View style={[styles.inputContainer, { backgroundColor: colors.footer, borderTopColor: colors.border }]}> 
          <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}> 
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Type a message..."
              value={draft}
              onChangeText={setDraft}
              multiline
              placeholderTextColor={colors.placeholder}
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
  listContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
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
  membersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  membersButtonText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
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
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  list: {
    flex: 1,
  },
  keyboardAvoid: {
    width: '100%',
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
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
})
