import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { DS } from '@/lib/tokens'

interface OracleSuggestionBoxProps {
  suggestion: string | null
  gameId: string
  testID?: string
}

export function OracleSuggestionBox({ suggestion, gameId: _gameId, testID }: OracleSuggestionBoxProps) {
  if (suggestion === null) return null

  return (
    <BlurView intensity={20} style={styles.blurContainer}>
      <View
        testID={testID ?? 'oracle-suggestion-box'}
        style={styles.container}
      >
        <Text style={styles.label}>Oracle Suggestion</Text>
        <Text style={styles.suggestion}>{suggestion}</Text>
      </View>
    </BlurView>
  )
}

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  container: {
    backgroundColor: `${DS.surfaceBright}66`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${DS.primaryContainer}33`,
    gap: 6,
  },
  label: {
    color: DS.primary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestion: {
    color: DS.onSurface,
    fontSize: 14,
    lineHeight: 20,
  },
})
