import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { DS } from '@/lib/tokens'

interface QuickActionCardProps {
  icon: 'auto_awesome' | 'photo_camera'
  label: string
  variant: 'primary' | 'secondary'
  onPress(): void
  testID?: string
}

export function QuickActionCard({ icon: _icon, label, variant, onPress, testID }: QuickActionCardProps) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.card, variant === 'primary' ? styles.cardPrimary : styles.cardSecondary]}
      onPress={onPress}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DS.surfaceContainerLow,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cardPrimary: {
    backgroundColor: DS.surfaceContainerLow,
  },
  cardSecondary: {
    backgroundColor: DS.surfaceContainerLow,
  },
  label: {
    color: DS.onSurface,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
})
