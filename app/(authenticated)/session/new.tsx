import React, { useState } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { GameCatalogService } from '@/services/GameCatalogService'
import { SessionService } from '@/services/SessionService'
import { queryKeys } from '@/lib/queryKeys'
import { DS } from '@/lib/tokens'

export default function NewSessionScreen() {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [players, setPlayers] = useState<string[]>([])
  const [currentPlayerInput, setCurrentPlayerInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: games = [], isLoading: isLoadingGames } = useQuery({
    queryKey: queryKeys.games(''),
    queryFn: () => GameCatalogService.search(''),
    staleTime: 300_000,
  })

  function addPlayer() {
    const trimmed = currentPlayerInput.trim()
    if (!trimmed) return
    setPlayers(prev => [...prev, trimmed])
    setCurrentPlayerInput('')
  }

  function removePlayer(index: number) {
    setPlayers(prev => prev.filter((_, i) => i !== index))
  }

  async function handleStart() {
    if (!selectedGameId || players.length === 0) return
    setIsSubmitting(true)
    setError(null)
    try {
      const newSession = await SessionService.create(
        selectedGameId,
        players.map(name => ({ display_name: name }))
      )
      router.replace(`/session/${newSession.id}/play` as any)
    } catch (e: any) {
      setError(e.message ?? 'Failed to start session')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canStart = selectedGameId !== null && players.length > 0

  return (
    <ScrollView testID="new-session-screen" style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>New Game</Text>

      {error && <Text testID="error-message" style={styles.error}>{error}</Text>}

      <Text style={styles.sectionLabel}>Select Game</Text>
      {isLoadingGames ? (
        <ActivityIndicator color={DS.primary} />
      ) : (
        <View style={styles.gameList}>
          {games.map(game => (
            <TouchableOpacity
              key={game.id}
              testID={`game-option-${game.id}`}
              style={[styles.gameOption, selectedGameId === game.id && styles.gameOptionSelected]}
              onPress={() => setSelectedGameId(game.id)}
            >
              <Text style={[styles.gameOptionText, selectedGameId === game.id && styles.gameOptionTextSelected]}>
                {game.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.sectionLabel}>Players</Text>
      <View style={styles.playerInputRow}>
        <TextInput
          testID="player-name-input"
          style={styles.input}
          placeholder="Player name"
          placeholderTextColor={DS.onSurfaceVariant}
          value={currentPlayerInput}
          onChangeText={setCurrentPlayerInput}
          onSubmitEditing={addPlayer}
          returnKeyType="done"
        />
        <TouchableOpacity testID="add-player-button" style={styles.addButton} onPress={addPlayer}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chips}>
        {players.map((name, index) => (
          <TouchableOpacity
            key={index}
            testID={`player-chip-${index}`}
            style={styles.chip}
            onPress={() => removePlayer(index)}
          >
            <Text style={styles.chipText}>{name} ×</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        testID="start-session-button"
        style={[styles.startButton, !canStart && styles.startButtonDisabled]}
        onPress={handleStart}
        disabled={!canStart || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={DS.onSurface} />
        ) : (
          <Text style={styles.startButtonText}>Start</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background },
  content: { padding: 16, gap: 16 },
  title: { color: DS.onSurface, fontSize: 28, fontWeight: '700' },
  sectionLabel: { color: DS.onSurfaceVariant, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  gameList: { gap: 8 },
  gameOption: {
    backgroundColor: DS.surfaceContainerHigh,
    borderRadius: 12,
    padding: 14,
  },
  gameOptionSelected: { backgroundColor: DS.primaryContainer },
  gameOptionText: { color: DS.onSurface, fontSize: 15 },
  gameOptionTextSelected: { fontWeight: '600' },
  playerInputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: DS.surfaceContainerHigh,
    color: DS.onSurface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButton: {
    backgroundColor: DS.primaryContainer,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: DS.onSurface, fontSize: 20, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: DS.surfaceContainerHighest,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { color: DS.onSurface, fontSize: 13 },
  startButton: {
    backgroundColor: DS.primaryContainer,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonDisabled: { opacity: 0.4 },
  startButtonText: { color: DS.onSurface, fontWeight: '600', fontSize: 16 },
  error: { color: '#ff5555', fontSize: 13 },
})
