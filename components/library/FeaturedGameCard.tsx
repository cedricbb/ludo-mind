import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { UserGame } from '../../lib/schemas'
import { DS } from '../../lib/tokens'

interface FeaturedGameCardProps {
  userGame: UserGame
  onLogPlay: () => void
  style?: StyleProp<ViewStyle>
}

export function FeaturedGameCard({ userGame, onLogPlay, style }: FeaturedGameCardProps) {
  const { game, play_count, last_played_at } = userGame
  const lastPlayed = last_played_at
    ? new Date(last_played_at).toLocaleDateString()
    : 'Never'

  return (
    <View testID="featured-game-card" style={[styles.container, style]}>
      {game.cover_url ? (
        <Image source={{ uri: game.cover_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.imageFallback]} />
      )}
      <View style={[StyleSheet.absoluteFillObject, styles.gradientOverlay]} />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>★ {play_count}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{game.title}</Text>
        <Text style={styles.players}>{game.min_players}–{game.max_players} players</Text>
        <TouchableOpacity testID="log-play-button" style={styles.logPlayButton} onPress={onLogPlay}>
          <Text style={styles.logPlayText}>Log Play</Text>
        </TouchableOpacity>
        <Text style={styles.lastPlayed}>{lastPlayed}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DS.surfaceContainerLow,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 280,
    borderColor: 'rgba(71,70,87,0.1)',
    borderWidth: 1,
  },
  imageFallback: { backgroundColor: DS.surfaceContainerLow },
  gradientOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: DS.tertiary, fontSize: 13, fontWeight: '700' },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  title: { color: DS.onSurface, fontSize: 24, fontWeight: '700', marginBottom: 4 },
  players: { color: DS.onSurfaceVariant, fontSize: 13, marginBottom: 10 },
  logPlayButton: {
    backgroundColor: DS.primaryContainer,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  logPlayText: { color: DS.onSurface, fontWeight: '700', fontSize: 14 },
  lastPlayed: { color: DS.onSurfaceVariant, fontSize: 11 },
})
