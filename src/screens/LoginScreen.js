import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { login } from '../../services/firebase'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter email and password.')
      return
    }
    try {
      setLoading(true)
      await login(email, password)
    } catch (error) {
      Alert.alert('Login failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollGrow} keyboardShouldPersistTaps="handled">
            <View style={styles.screenBackground}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="clock-outline" size={44} color="#fff" />
            </View>
            <Text style={styles.title}>3F TSys</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#5d6d86" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#a8b3c3"
              />
            </View>

            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#5d6d86" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#a8b3c3"
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.link}>Create one</Text>
            </Pressable>
          </View>
        </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8effb',
  },
  scrollGrow: {
    flexGrow: 1,
  },
  screenBackground: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 26,
    shadowColor: '#1b4fcd',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 74,
    height: 74,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10203f',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#5a6b8f',
    marginTop: 6,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f8ff',
    borderWidth: 1,
    borderColor: '#dde5f2',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2d45',
  },
  button: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    backgroundColor: '#74a9ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#5d6d86',
    fontSize: 15,
  },
  link: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '700',
  },
})
