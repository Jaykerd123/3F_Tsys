import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
      <Text style={styles.title}>Create your account</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.roles}>
        <Pressable style={[styles.roleButton, role === 'worker' && styles.roleSelected]} onPress={() => setRole('worker')}>
          <Text style={role === 'worker' ? styles.roleTextSelected : styles.roleText}>Worker</Text>
        </Pressable>
        <Pressable style={[styles.roleButton, role === 'admin' && styles.roleSelected]} onPress={() => setRole('admin')}>
          <Text style={role === 'admin' ? styles.roleTextSelected : styles.roleText}>Admin</Text>
        </Pressable>
      </View>
      <Button title={loading ? 'Creating account...' : 'Sign Up'} onPress={handleSignup} disabled={loading} />
      <View style={styles.footer}>
        <Text>Already have an account?</Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
          Sign In
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  input: {
    height: 48,
    borderColor: '#999',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  roles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  roleSelected: {
    backgroundColor: '#0066cc',
  },
  roleText: {
    color: '#333',
  },
  roleTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  link: {
    color: '#0066cc',
  },
})
