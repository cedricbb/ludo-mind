import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { DS } from '@/lib/tokens'
import { GameSessionListItem } from '@/lib/schemas'
import { Game } from '@/lib/schemas'

interface ActiveSessionCardProps {
  session: GameSessionListItem
  game: Game
  onResume(): void
  onHistory(): void
  oracleSuggestion: string | null
  testID?: string
}

export function ActiveSessionCard({
  session,
  game,
  onResume,
  onHistory,
  testID,
}: ActiveSessionCardProps) {
  return (
    <View testID={testID ?? 'active-session-card'} style={styles.card}>
      <Text style={styles.gameTitle}>{game.title}</Text>
      <Text style={styles.playerCount}>
        {session.players.length} player{session.players.length !== 1 ? 's' : ''} · Round {session.rounds.length}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity testID="resume-button" style={styles.resumeButton} onPress={onResume}>
          <Text style={styles.resumeText}>Resume Game</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="history-button" style={styles.historyButton} onPress={onHistory}>
          <Text style={styles.historyText}>History</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DS.glassPanel,
    borderRadius: 32,
    overflow: 'hidden',
    padding: 20,
    gap: 8,
  },
  gameTitle: {
    color: DS.onSurface,
    fontSize: 20,
    fontWeight: '700',
  },
  playerCount: {
    color: DS.onSurfaceVariant,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  resumeButton: {
    flex: 1,
    backgroundColor: DS.primaryContainer,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resumeText: {
    color: DS.onSurface,
    fontWeight: '600',
    fontSize: 14,
  },
  historyButton: {
    flex: 1,
    backgroundColor: DS.surfaceContainerHigh,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  historyText: {
    color: DS.onSurfaceVariant,
    fontWeight: '500',
    fontSize: 14,
  },
})
