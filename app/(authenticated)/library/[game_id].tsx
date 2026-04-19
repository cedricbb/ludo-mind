import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { GameCatalogService } from '../../../services/GameCatalogService'
import { queryKeys } from '../../../lib/queryKeys'
import { useLibrary } from '../../../hooks/useLibrary'
import { DS } from '../../../lib/tokens'

export default function GameDetailScreen() {
  const params = useLocalSearchParams<{ game_id: string }>()
  const parsed = z.string().uuid().safeParse(params.game_id)

  if (!parsed.success) {
    router.replace('/library' as any)
    return null
  }

  const gameId = parsed.data

  const { data: games = [], isLoading } = useQuery({
    queryKey: queryKeys.gameDetail(gameId),
    queryFn: () => GameCatalogService.search(gameId),
    staleTime: 300_000,
  })

  const game = games[0]
  const { games: libraryGames, addGame } = useLibrary()
  const alreadyAdded = libraryGames.some(ug => ug.game_id === gameId)

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (!game) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Game not found</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {game.cover_url ? (
        <Image source={{ uri: game.cover_url }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverFallback]} />
      )}

      <View style={styles.body}>
        <Text style={styles.title}>{game.title}</Text>

        <View style={styles.badges}>
          <View testID="badge-scoring-family" style={styles.badge}>
            <Text style={styles.badgeText}>{game.scoring_family}</Text>
          </View>
          {game.rules_indexed && (
            <View testID="badge-rules-indexed" style={styles.badge}>
              <Text style={styles.badgeText}>Rules ✓</Text>
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{game.min_players}–{game.max_players} players</Text>
          <Text style={styles.metaText}>{game.category}</Text>
        </View>

        {game.description && (
          <Text style={styles.description}>{game.description}</Text>
        )}

        {!alreadyAdded && (
          <TouchableOpacity
            testID="add-game-button"
            style={styles.addButton}
            onPress={() => addGame(gameId)}
          >
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background },
  content: { paddingBottom: 40 },
  cover: { width: '100%', height: 260 },
  coverFallback: { backgroundColor: DS.surfaceContainerLow },
  body: { padding: 20 },
  title: { color: DS.onSurface, fontSize: 26, fontWeight: '700', marginBottom: 16 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  badge: {
    backgroundColor: DS.surfaceContainerHigh, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20,
  },
  badgeText: { color: DS.primary, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  meta: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaText: { color: DS.onSurfaceVariant, fontSize: 14 },
  description: { color: DS.onSurface, fontSize: 14, lineHeight: 22, marginBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DS.background },
  loadingText: { color: DS.onSurfaceVariant, fontSize: 16 },
  addButton: {
    backgroundColor: DS.primaryContainer, paddingVertical: 14,
    borderRadius: 14, alignItems: 'center',
  },
  addButtonText: { color: DS.onSurface, fontWeight: '700', fontSize: 16 },
})
