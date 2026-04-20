import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { SessionService } from '@/services/SessionService'
import { GameCatalogService } from '@/services/GameCatalogService'
import { useActiveSession } from '@/hooks/useActiveSession'
import { queryKeys } from '@/lib/queryKeys'
import { DS } from '@/lib/tokens'
import { RoundResult } from '@/lib/schemas'

export default function PlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { addRound, endSession } = useActiveSession()

  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: queryKeys.session(id ?? ''),
    queryFn: () => SessionService.getById(id!),
    enabled: !!id,
    staleTime: 10_000,
  })

  const { data: game } = useQuery({
    queryKey: queryKeys.gameDetail(session?.game_id ?? ''),
    queryFn: () => GameCatalogService.getById(session!.game_id),
    enabled: !!session,
    staleTime: 300_000,
  })

  const [roundFields, setRoundFields] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [oracleVisible, setOracleVisible] = useState(false)

  useEffect(() => {
    if (session?.status === 'finished') {
      router.replace(`/session/${id}/end` as any)
    }
  }, [session?.status, id])

  useEffect(() => {
    if (!oracleVisible) return
    // placeholder for future oracle logic
  }, [oracleVisible])

  async function handleAddRound() {
    if (!session) return
    setIsSubmitting(true)
    try {
      const roundResults: RoundResult[] = session.players.map(player => ({
        player_id: player.id,
        score: parseFloat(roundFields[player.id] ?? '0') || 0,
      }))
      await addRound(roundResults)
      setRoundFields({})
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEnd() {
    if (!id) return
    setIsSubmitting(true)
    try {
      await endSession()
      router.replace(`/session/${id}/end` as any)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingSession || !session) {
    return (
      <View testID="play-screen-loading" style={styles.loading}>
        <ActivityIndicator color={DS.primary} />
      </View>
    )
  }

  return (
    <ScrollView testID="play-screen" style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{game?.title ?? 'Game'}</Text>
      <Text style={styles.subtitle}>Round {session.rounds.length + 1}</Text>

      {session.players.map(player => (
        <View key={player.id} style={styles.playerRow}>
          <Text style={styles.playerName}>{player.display_name}</Text>
          <TextInput
            testID={`score-input-${player.id}`}
            style={styles.scoreInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={DS.onSurfaceVariant}
            value={roundFields[player.id] ?? ''}
            onChangeText={value => setRoundFields(prev => ({ ...prev, [player.id]: value }))}
          />
        </View>
      ))}

      <TouchableOpacity
        testID="add-round-button"
        style={styles.addRoundButton}
        onPress={handleAddRound}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={DS.onSurface} />
        ) : (
          <Text style={styles.addRoundText}>Submit Round</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        testID="end-session-button"
        style={styles.endButton}
        onPress={handleEnd}
        disabled={isSubmitting}
      >
        <Text style={styles.endButtonText}>Terminer la partie</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="fab-oracle"
        style={styles.fabOracle}
        onPress={() => router.push(`/oracle/${session.game_id}` as any)}
      >
        <Text style={styles.fabText}>Oracle</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background },
  content: { padding: 16, gap: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DS.background },
  title: { color: DS.onSurface, fontSize: 24, fontWeight: '700' },
  subtitle: { color: DS.onSurfaceVariant, fontSize: 14 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.surfaceContainerHigh,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  playerName: { flex: 1, color: DS.onSurface, fontSize: 15 },
  scoreInput: {
    width: 80,
    backgroundColor: DS.surfaceContainerHighest,
    color: DS.onSurface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'right',
  },
  addRoundButton: {
    backgroundColor: DS.primaryContainer,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addRoundText: { color: DS.onSurface, fontWeight: '600', fontSize: 15 },
  endButton: {
    backgroundColor: DS.surfaceContainerHigh,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  endButtonText: { color: DS.onSurfaceVariant, fontWeight: '500', fontSize: 14 },
  fabOracle: {
    backgroundColor: DS.primaryContainer,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'center',
    shadowColor: DS.shadowPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  fabText: { color: DS.onSurface, fontWeight: '600', fontSize: 14 },
})
