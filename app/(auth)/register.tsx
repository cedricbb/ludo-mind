import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { AuthService } from '../../services/AuthService'
import { DS } from '../../lib/tokens'

export default function RegisterScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleRegister() {
    if (isLoading) return
    setError(null)
    setIsLoading(true)
    try {
      await AuthService.register(email, password)
      router.replace('/(auth)/login')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container} testID="register-screen">
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={DS.onSurfaceVariant}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="register-email-input"
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min 8 characters)"
        placeholderTextColor={DS.onSurfaceVariant}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="register-password-input"
        editable={!isLoading}
      />
      {error ? <Text style={styles.error} testID="register-error">{error}</Text> : null}
      <TouchableOpacity
        style={[styles.cta, isLoading && styles.ctaDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
        testID="register-submit-btn"
        accessibilityState={{ disabled: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator color={DS.onSurface} />
        ) : (
          <Text style={styles.ctaText}>Create Account</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/(auth)/login')} testID="register-login-link">
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background, padding: 24, justifyContent: 'center' },
  title: { color: DS.onSurface, fontSize: 24, fontWeight: '700', marginBottom: 32 },
  input: {
    backgroundColor: DS.surfaceContainerLow,
    color: DS.onSurface,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  error: { color: '#ff6b6b', marginBottom: 12, fontSize: 14 },
  cta: {
    backgroundColor: DS.primaryContainer,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: DS.onSurface, fontSize: 16, fontWeight: '600' },
  link: { color: DS.primary, textAlign: 'center', marginTop: 20, fontSize: 14 },
})
