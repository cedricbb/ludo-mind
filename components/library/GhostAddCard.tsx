import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { DS } from '../../lib/tokens'

interface GhostAddCardProps {
  onPress: () => void
  style?: StyleProp<ViewStyle>
}

export function GhostAddCard({ onPress, style }: GhostAddCardProps) {
  return (
    <TouchableOpacity
      testID="ghost-add-card"
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>+</Text>
      </View>
      <Text style={styles.label}>Add to Vault</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DS.surfaceContainerLow,
    borderStyle: 'dashed',
    borderColor: 'rgba(71,70,87,0.2)',
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DS.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: DS.onSurfaceVariant, fontSize: 28, fontWeight: '300', lineHeight: 32 },
  label: { color: DS.onSurfaceVariant, fontSize: 16, fontWeight: '600' },
})
