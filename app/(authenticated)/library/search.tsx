import React, { useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { GameCatalogService } from '../../../services/GameCatalogService'
import { queryKeys } from '../../../lib/queryKeys'
import { Game } from '../../../lib/schemas'
import { DS } from '../../../lib/tokens'
import { useDebounce } from '../../../hooks/useDebounce'

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const enabled = debouncedQuery.length >= 2

  const { data: games = [], isFetching } = useQuery({
    queryKey: queryKeys.games(debouncedQuery),
    queryFn: () => GameCatalogService.search(debouncedQuery),
    enabled,
    staleTime: 30_000,
  })

  return (
    <View style={styles.container}>
      <TextInput
        testID="search-input"
        style={styles.input}
        placeholder="Search games..."
        placeholderTextColor={DS.onSurfaceVariant}
        value={query}
        onChangeText={setQuery}
        autoFocus
      />

      {!enabled ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Tapez au moins 2 caractères</Text>
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <GameSearchCard game={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  )
}

function GameSearchCard({ game }: { game: Game }) {
  return (
    <TouchableOpacity
      testID={`search-result-${game.id}`}
      style={styles.card}
      onPress={() => router.push(`/library/${game.id}` as any)}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{game.title}</Text>
        <Text style={styles.cardCategory}>{game.category.toUpperCase()}</Text>
      </View>
      {game.rules_indexed && (
        <View style={styles.rulesBadge}>
          <Text style={styles.rulesBadgeText}>Rules</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background, padding: 16 },
  input: {
    backgroundColor: DS.surfaceContainerHigh, color: DS.onSurface,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 16, fontSize: 16,
  },
  hint: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hintText: { color: DS.onSurfaceVariant, fontSize: 14 },
  list: { gap: 8 },
  card: {
    backgroundColor: DS.surfaceContainerHigh, borderRadius: 12,
    padding: 14, flexDirection: 'row', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { color: DS.onSurface, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  cardCategory: { color: DS.secondary, fontSize: 11, fontWeight: '600' },
  rulesBadge: {
    backgroundColor: DS.primaryContainer, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8,
  },
  rulesBadgeText: { color: DS.onSurface, fontSize: 11, fontWeight: '600' },
})
