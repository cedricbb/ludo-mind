import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { ProfileService } from '../../services/ProfileService'
import { AuthService } from '../../services/AuthService'
import { DS } from '../../lib/tokens'
import { User } from '../../lib/schemas'

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ProfileService.getMe()
      .then(u => {
        setUser(u)
        setDisplayName(u.display_name)
        setAvatarUrl(u.avatar_url ?? '')
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    if (isLoading) return
    setError(null)
    setIsLoading(true)
    try {
      const updated = await ProfileService.update({
        display_name: displayName || undefined,
        avatar_url: avatarUrl || null,
      })
      setUser(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogout() {
    await AuthService.logout()
  }

  return (
    <View style={styles.container} testID="profile-screen">
      {user ? (
        <>
          <View style={styles.header}>
            <Text style={styles.email} testID="profile-email">{user.email}</Text>
            {user.plan === 'premium' ? (
              <View style={styles.badgePremium} testID="badge-premium">
                <Text style={styles.badgePremiumText}>Premium</Text>
              </View>
            ) : (
              <View style={styles.badgeFree} testID="badge-free">
                <Text style={styles.badgeFreeText}>Free</Text>
              </View>
            )}
          </View>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display name"
            placeholderTextColor={DS.onSurfaceVariant}
            testID="profile-display-name-input"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="Avatar URL"
            placeholderTextColor={DS.onSurfaceVariant}
            testID="profile-avatar-url-input"
            autoCapitalize="none"
            editable={!isLoading}
          />
          {error ? <Text style={styles.error} testID="profile-error">{error}</Text> : null}
          <TouchableOpacity
            style={[styles.cta, isLoading && styles.ctaDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            testID="profile-save-btn"
          >
            {isLoading ? (
              <ActivityIndicator color={DS.onSurface} />
            ) : (
              <Text style={styles.ctaText}>Save</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.logout} onPress={handleLogout} testID="profile-logout-btn">
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View testID="profile-empty-state" />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  email: { color: DS.onSurface, fontSize: 16, flex: 1 },
  badgePremium: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: DS.primaryContainer,
  },
  badgePremiumText: { color: DS.onSurface, fontSize: 12, fontWeight: '600' },
  badgeFree: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(71,70,87,0.15)',
  },
  badgeFreeText: { color: DS.onSurfaceVariant, fontSize: 12 },
  input: {
    backgroundColor: DS.surfaceContainerLow,
    color: DS.onSurface,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  error: { color: '#ff6b6b', marginBottom: 12 },
  cta: {
    backgroundColor: DS.primaryContainer,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: DS.onSurface, fontSize: 16, fontWeight: '600' },
  logout: { marginTop: 24, alignItems: 'center' },
  logoutText: { color: DS.onSurfaceVariant, fontSize: 14 },
})
