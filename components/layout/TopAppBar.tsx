import React, { memo } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { DS } from '../../lib/tokens'
import { User } from '../../lib/schemas'

interface Props {
  user: User | null
}

export const TopAppBar = memo(function TopAppBar({ user }: Props) {
  return (
    <View style={styles.container} testID="top-app-bar">
      <Text style={styles.logo}>Ludo-Mind</Text>
      {user?.avatar_url ? (
        <Image
          source={{ uri: user.avatar_url }}
          style={styles.avatar}
          testID="top-app-bar-avatar"
          accessibilityLabel={user.display_name}
        />
      ) : (
        <View style={styles.avatarPlaceholder} testID="top-app-bar-avatar-placeholder" />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0A1F',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  logo: {
    color: DS.onSurface,
    fontSize: 18,
    fontWeight: '700',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DS.surfaceContainerHigh,
  },
})
