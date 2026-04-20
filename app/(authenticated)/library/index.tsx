import React, { useState } from 'react'
import { View, ScrollView, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useLibrary } from '@/hooks/useLibrary'
import { FeaturedGameCard } from '@/components/library/FeaturedGameCard'
import { StandardGameCard } from '@/components/library/StandardGameCard'
import { GhostAddCard } from '@/components/library/GhostAddCard'
import { DS } from '@/lib/tokens'

type Tab = 'collection' | 'history'

export default function LibraryScreen() {
  const { games, isLoading } = useLibrary()
  const [activeTab, setActiveTab] = useState<Tab>('collection')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = searchQuery
    ? games.filter(g => g.game.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : games

  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          testID="tab-collection"
          onPress={() => setActiveTab('collection')}
          style={[styles.tab, activeTab === 'collection' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'collection' && styles.tabTextActive]}>
            Collection
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="tab-history"
          onPress={() => setActiveTab('history')}
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'history' ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No play history yet</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={DS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Vault</Text>
            <Text style={styles.headerSubtitle}>
              Commanding {games.length} titles across the multiverse.
            </Text>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              testID="library-search"
              style={styles.input}
              placeholder="Search the archives..."
              placeholderTextColor={DS.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.filtersButton}>
              <Text style={styles.filtersText}>Filters</Text>
            </TouchableOpacity>
          </View>

          {games.length === 0 ? (
            <GhostAddCard
              onPress={() => router.push('/library/search')}
              style={styles.emptyGhost}
            />
          ) : (
            <>
              {featured && (
                <FeaturedGameCard
                  userGame={featured}
                  onLogPlay={() => {}}
                  style={styles.featured}
                />
              )}

              <View style={styles.grid}>
                {rest.map(ug => (
                  <View key={ug.id} style={styles.gridItem}>
                    <StandardGameCard
                      userGame={ug}
                      onPress={id => router.push(`/library/${id}` as any)}
                    />
                  </View>
                ))}
                <View style={styles.gridItem}>
                  <GhostAddCard onPress={() => router.push('/library/search')} />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.background },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: DS.surfaceContainerHighest,
    borderRadius: 8,
  },
  tabText: { color: DS.onSurfaceVariant, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: DS.secondary },
  scroll: { padding: 16, gap: 12 },
  header: { marginBottom: 4 },
  headerTitle: { color: DS.onSurface, fontSize: 36, fontWeight: '700' },
  headerSubtitle: { color: DS.onSurfaceVariant, fontSize: 14, marginTop: 4 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: DS.surfaceContainerHigh, color: DS.onSurface,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  filtersButton: {
    backgroundColor: DS.surfaceContainerHigh,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  filtersText: { color: DS.onSurfaceVariant, fontSize: 14 },
  featured: { marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyGhost: { marginTop: 16 },
  emptyText: { color: DS.onSurfaceVariant, fontSize: 16 },
})
