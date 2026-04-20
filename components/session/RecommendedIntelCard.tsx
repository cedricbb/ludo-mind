import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { DS } from '@/lib/tokens'
import { Game } from '@/lib/schemas'

interface RecommendedIntelCardProps {
  game: Game
  badgeVariant: 'tertiary' | 'secondary' | 'primary'
  onPress(gameId: string): void
  testID?: string
}

const BADGE_COLORS: Record<'tertiary' | 'secondary' | 'primary', string> = {
  tertiary: DS.tertiary,
  secondary: DS.secondary,
  primary: DS.primary,
}

export function RecommendedIntelCard({ game, badgeVariant, onPress, testID }: RecommendedIntelCardProps) {
  return (
    <TouchableOpacity testID={testID} style={styles.card} onPress={() => onPress(game.id)}>
      <View style={[styles.badge, { backgroundColor: BADGE_COLORS[badgeVariant] }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.category}>{game.category}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DS.surfaceContainerHigh,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  title: {
    color: DS.onSurface,
    fontSize: 14,
    fontWeight: '600',
  },
  category: {
    color: DS.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
})
