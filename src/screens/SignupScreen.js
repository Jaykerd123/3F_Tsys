import React, { useState } from 'react'
import { ActivityIndicator, View, Text, TextInput, StyleSheet, Alert, Pressable, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { signUp } from '../../services/firebase'

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('worker')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Validation', 'Please fill in all fields.')
      return
    }
    try {
      setLoading(true)
      await signUp(email, password, name, role)
    } catch (error) {
      Alert.alert('Signup failed', error.message)
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
              <MaterialCommunityIcons name="account-plus-outline" size={34} color="#fff" />
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Setup your profile and role</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Full name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#a8b3c3"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#a8b3c3"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#a8b3c3"
          />

          <Text style={styles.sectionLabel}>Choose your role</Text>
          <View style={styles.roles}>
            <Pressable style={[styles.roleButton, role === 'worker' && styles.roleSelected]} onPress={() => setRole('worker')}>
              <Text style={role === 'worker' ? styles.roleTextSelected : styles.roleText}>Worker</Text>
            </Pressable>
            <Pressable style={[styles.roleButton, role === 'admin' && styles.roleSelected]} onPress={() => setRole('admin')}>
              <Text style={role === 'admin' ? styles.roleTextSelected : styles.roleText}>Admin</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign In</Text>
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
    marginBottom: 24,
  },
  logoContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#10203f',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#5a6b8f',
  },
  input: {
    height: 52,
    backgroundColor: '#f5f8ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dde5f2',
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2d45',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5a6b8f',
    marginBottom: 12,
  },
  roles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#c8d2e6',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f5f8ff',
  },
  roleSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleText: {
    color: '#344165',
    fontWeight: '600',
  },
  roleTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
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
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#5d6d86',
    fontSize: 15,
  },
  link: {
    color: '#007AFF',
    fontWeight: '700',
    marginLeft: 6,
  },
})
