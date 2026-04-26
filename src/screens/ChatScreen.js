import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello!', sender: 'bot' },
    { id: '2', text: 'Hi, how can I help you today?', sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const sendMessage = () => {
    if (inputText.trim()) {
      setMessages([...messages, { id: Date.now().toString(), text: inputText, sender: 'user' }]);
      setInputText('');
    }
  };

  const renderBubble = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderBubble}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listContent: {
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: '#FFF',
  },
  botText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F7F7F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
