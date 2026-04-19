import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { AuthService } from '../../services/AuthService'
import { DS } from '../../lib/tokens'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin() {
    if (isLoading) return
    setError(null)
    setIsLoading(true)
    try {
      await AuthService.login(email, password)
      router.replace('/(authenticated)/profile')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container} testID="login-screen">
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={DS.onSurfaceVariant}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="login-email-input"
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={DS.onSurfaceVariant}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="login-password-input"
        editable={!isLoading}
      />
      {error ? <Text style={styles.error} testID="login-error">{error}</Text> : null}
      <TouchableOpacity
        style={[styles.cta, isLoading && styles.ctaDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
        testID="login-submit-btn"
        accessibilityState={{ disabled: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator color={DS.onSurface} />
        ) : (
          <Text style={styles.ctaText}>Sign In</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/register')} testID="login-register-link">
        <Text style={styles.link}>Create account</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="login-forgot-link">
        <Text style={styles.tertiaryLink}>Forgot password?</Text>
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
  tertiaryLink: { color: DS.tertiary, textAlign: 'center', marginTop: 12, fontSize: 14 },
})
