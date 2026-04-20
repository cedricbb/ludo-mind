import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { SessionService } from '@/services/SessionService'
import { GameCatalogService } from '@/services/GameCatalogService'
import { queryKeys } from '@/lib/queryKeys'
import { DS } from '@/lib/tokens'

export default function EndScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: session, isLoading } = useQuery({
    queryKey: queryKeys.session(id ?? ''),
    queryFn: () => SessionService.getById(id!),
    enabled: !!id,
    staleTime: 300_000,
  })

  const { data: game } = useQuery({
    queryKey: queryKeys.gameDetail(session?.game_id ?? ''),
    queryFn: () => GameCatalogService.getById(session!.game_id),
    enabled: !!session,
    staleTime: 300_000,
  })

  if (isLoading || !session) {
    return (
      <View testID="end-screen-loading" style={styles.loading}>
        <ActivityIndicator color={DS.primary} />
      </View>
    )
  }

  const sortedScores = session.final_scores
    ? [...session.final_scores].sort((a, b) => a.rank - b.rank)
    : []

  return (
    <ScrollView testID="end-screen" style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Game Over</Text>
      <Text style={styles.gameName}>{game?.title ?? 'Game'}</Text>

      <View testID="podium" style={styles.podium}>
        {sortedScores.map(score => (
          <View
            key={score.id}
            testID={`score-row-rank-${score.rank}`}
            style={[
              styles.scoreRow,
              score.rank === 1 ? styles.scoreRowFirst : styles.scoreRowOther,
            ]}
          >
            <Text style={styles.rank}>#{score.rank}</Text>
            <Text style={styles.displayName}>{score.display_name}</Text>
            <Text style={styles.total}>{score.total}</Text>
          </View>
        ))}
      </View>

      {sortedScores.length === 0 && (
        <Text style={styles.noScores}>No scores recorded</Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          testID="replay-button"
          style={styles.replayButton}
          onPress={() => router.push('/session/new' as any)}
        >
          <Text style={styles.replayText}>Rejouer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="back-button"
          style={styles.backButton}
          onPress={() => router.push('/' as any)}
        >
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background },
  content: { padding: 16, gap: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DS.background },
  title: { color: DS.onSurface, fontSize: 28, fontWeight: '700' },
  gameName: { color: DS.onSurfaceVariant, fontSize: 16 },
  podium: { gap: 8 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  scoreRowFirst: {
    backgroundColor: DS.tertiary,
    shadowColor: DS.tertiary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  scoreRowOther: {
    backgroundColor: DS.surfaceContainerHigh,
  },
  rank: { color: DS.background, fontWeight: '700', fontSize: 16, width: 28 },
  displayName: { flex: 1, color: DS.onSurface, fontSize: 15, fontWeight: '500' },
  total: { color: DS.onSurface, fontSize: 16, fontWeight: '700' },
  noScores: { color: DS.onSurfaceVariant, textAlign: 'center', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12 },
  replayButton: {
    flex: 1,
    backgroundColor: DS.primaryContainer,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  replayText: { color: DS.onSurface, fontWeight: '600', fontSize: 15 },
  backButton: {
    flex: 1,
    backgroundColor: DS.surfaceContainerHigh,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backText: { color: DS.onSurfaceVariant, fontWeight: '500', fontSize: 15 },
})
