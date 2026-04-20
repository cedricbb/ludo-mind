import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { UserGame } from '../../lib/schemas'
import { DS } from '../../lib/tokens'

interface StandardGameCardProps {
  userGame: UserGame
  onPress: (gameId: string) => void
  style?: StyleProp<ViewStyle>
}

export function StandardGameCard({ userGame, onPress, style }: StandardGameCardProps) {
  const { game, play_count } = userGame

  return (
    <TouchableOpacity
      testID="standard-game-card"
      style={[styles.container, style]}
      onPress={() => onPress(game.id)}
      activeOpacity={0.85}
    >
      {game.cover_url ? (
        <Image source={{ uri: game.cover_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.imageFallback]} />
      )}
      <View style={[StyleSheet.absoluteFillObject, styles.gradientOverlay]} />

      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{game.category.toUpperCase()}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.meta}>
          {game.min_players}–{game.max_players} · {play_count} parties
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DS.surfaceContainerLow,
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 1,
  },
  imageFallback: { backgroundColor: DS.surfaceContainerLow },
  gradientOverlay: { backgroundColor: 'rgba(0,0,0,0.45)' },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  categoryText: {
    color: DS.secondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  title: { color: DS.onSurface, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  meta: { color: DS.tertiary, fontSize: 11, fontWeight: '700' },
})
